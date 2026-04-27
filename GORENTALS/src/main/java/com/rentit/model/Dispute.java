package com.rentit.model;

import com.rentit.model.enums.DisputeStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A dispute raised by either party during the post-return window (24–48h).
 *
 * When a dispute is OPEN:
 *   - Booking.escrowStatus moves to ON_HOLD (no payout possible)
 *   - BookingEscrowService.holdForDispute() is called automatically
 *
 * Resolution paths:
 *   RESOLVED_REFUND  → full refund to renter, no payout to owner
 *   RESOLVED_PAYOUT  → full payout to owner, no refund to renter
 *   RESOLVED_SPLIT   → ownerPayoutAmt + renterRefundAmt = total escrow
 *   REJECTED         → dispute was frivolous; normal payout proceeds
 *
 * Evidence:
 *   evidenceUrls must contain time-stamped S3/GCS URLs of before/after photos
 *   uploaded within the app. External links are rejected at the service layer.
 *
 * One active dispute per booking at a time
 * (enforced via DisputeRepository.existsByBookingIdAndStatusIn check).
 */
@Entity
@Table(
    name = "disputes",
    indexes = {
        @Index(name = "idx_disputes_booking", columnList = "booking_id"),
        @Index(name = "idx_disputes_status",  columnList = "status")
    }
)
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "booking_id", nullable = false, updatable = false)
    private UUID bookingId;

    /** User ID of whoever opened the dispute (renter or owner). */
    @Column(name = "opened_by", nullable = false, updatable = false)
    private UUID openedBy;

    /** "RENTER" or "OWNER" — determines default resolution bias. */
    @Column(name = "opened_by_role", nullable = false, length = 8, updatable = false)
    private String openedByRole;

    /**
     * Reason code — one of:
     *   NOT_DELIVERED   owner did not hand over the item
     *   DAMAGED_ITEM    item returned in worse condition than listed
     *   LATE_RETURN     renter kept item beyond rental end date
     *   WRONG_ITEM      item does not match listing description
     *   OTHER           catch-all, requires detailed description
     */
    @Column(name = "reason_code", nullable = false, length = 32, updatable = false)
    private String reasonCode;

    /** Free-text description of the problem. Min 20 chars enforced at controller. */
    @Column(updatable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private DisputeStatus status = DisputeStatus.OPEN;

    /**
     * S3/GCS URLs of supporting evidence (photos, videos, receipts).
     * Stored as PostgreSQL TEXT[] array.
     * Frontend uploads via presigned URL; only the resulting key is stored here.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "evidence_urls", columnDefinition = "text[]")
    private List<String> evidenceUrls = new ArrayList<>();

    /**
     * Amount to be paid out to owner as part of resolution.
     * Null until dispute is resolved. Populated by admin via ResolveDisputeRequest.
     */
    @Column(name = "owner_payout_amt", precision = 12, scale = 2)
    private BigDecimal ownerPayoutAmt;

    /**
     * Amount to be refunded to renter as part of resolution.
     * ownerPayoutAmt + renterRefundAmt should equal total escrow held.
     * Split validation is enforced at DisputeService.resolveDispute().
     */
    @Column(name = "renter_refund_amt", precision = 12, scale = 2)
    private BigDecimal renterRefundAmt;

    /** Admin user ID who resolved the dispute. */
    @Column(name = "resolved_by")
    private UUID resolvedBy;

    /** Admin notes explaining the resolution decision. Required on resolution. */
    @Column(name = "resolution_notes")
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    // ── Constructors ─────────────────────────────────────────────────────────

    protected Dispute() {}

    /**
     * Called by DisputeService.openDispute() after eligibility checks pass.
     */
    public Dispute(
        UUID bookingId,
        UUID openedBy,
        String openedByRole,
        String reasonCode,
        String description,
        List<String> evidenceUrls
    ) {
        this.bookingId    = bookingId;
        this.openedBy     = openedBy;
        this.openedByRole = openedByRole;
        this.reasonCode   = reasonCode;
        this.description  = description;
        this.evidenceUrls = evidenceUrls != null ? evidenceUrls : new ArrayList<>();
    }

    // ── State transitions ─────────────────────────────────────────────────────

    /** Admin moves dispute to UNDER_REVIEW when they start investigating. */
    public void startReview() {
        if (this.status != DisputeStatus.OPEN)
            throw new IllegalStateException("Can only start review on OPEN disputes");
        this.status    = DisputeStatus.UNDER_REVIEW;
        this.updatedAt = Instant.now();
    }

    /**
     * Final resolution — called by DisputeService.resolveDispute().
     *
     * @param resolution    one of RESOLVED_REFUND / RESOLVED_PAYOUT / RESOLVED_SPLIT / REJECTED
     * @param ownerAmt      amount to release to owner (0 for full refund)
     * @param renterAmt     amount to refund to renter (0 for full payout)
     * @param resolvedBy    admin user ID
     * @param notes         mandatory explanation of the decision
     */
    public void resolve(
        DisputeStatus resolution,
        BigDecimal ownerAmt,
        BigDecimal renterAmt,
        UUID resolvedBy,
        String notes
    ) {
        if (resolution == DisputeStatus.OPEN || resolution == DisputeStatus.UNDER_REVIEW)
            throw new IllegalArgumentException(
                "Resolution must be a terminal status, got: " + resolution);

        if (notes == null || notes.isBlank())
            throw new IllegalArgumentException("Resolution notes are required");

        this.status          = resolution;
        this.ownerPayoutAmt  = ownerAmt  != null ? ownerAmt  : BigDecimal.ZERO;
        this.renterRefundAmt = renterAmt != null ? renterAmt : BigDecimal.ZERO;
        this.resolvedBy      = resolvedBy;
        this.resolutionNotes = notes;
        this.updatedAt       = Instant.now();
    }

    // ── Convenience ───────────────────────────────────────────────────────────

    public boolean isActive() {
        return status == DisputeStatus.OPEN || status == DisputeStatus.UNDER_REVIEW;
    }

    public boolean isResolved() {
        return status == DisputeStatus.RESOLVED_REFUND
            || status == DisputeStatus.RESOLVED_PAYOUT
            || status == DisputeStatus.RESOLVED_SPLIT
            || status == DisputeStatus.REJECTED;
    }

    /** Adds a new evidence URL after the dispute is opened (within evidence window). */
    public void addEvidence(String url) {
        if (!isActive())
            throw new IllegalStateException("Cannot add evidence to a resolved dispute");
        if (this.evidenceUrls == null) this.evidenceUrls = new ArrayList<>();
        this.evidenceUrls.add(url);
        this.updatedAt = Instant.now();
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()                  { return id; }
    public UUID getBookingId()           { return bookingId; }
    public UUID getOpenedBy()            { return openedBy; }
    public String getOpenedByRole()      { return openedByRole; }
    public String getReasonCode()        { return reasonCode; }
    public String getDescription()       { return description; }
    public DisputeStatus getStatus()     { return status; }
    public List<String> getEvidenceUrls(){ return evidenceUrls; }
    public BigDecimal getOwnerPayoutAmt()  { return ownerPayoutAmt; }
    public BigDecimal getRenterRefundAmt() { return renterRefundAmt; }
    public UUID getResolvedBy()          { return resolvedBy; }
    public String getResolutionNotes()   { return resolutionNotes; }
    public Instant getCreatedAt()        { return createdAt; }
    public Instant getUpdatedAt()        { return updatedAt; }

    @Override
    public String toString() {
        return String.format(
            "Dispute{id=%s, booking=%s, reason=%s, status=%s, openedBy=%s(%s)}",
            id, bookingId, reasonCode, status, openedBy, openedByRole
        );
    }
}
