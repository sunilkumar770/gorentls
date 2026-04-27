package com.rentit.model;

import com.rentit.model.enums.PayoutStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a single outgoing transfer to an owner's bank/UPI account,
 * initiated via RazorpayX Payouts API.
 *
 * Lifecycle:
 *   PENDING → INITIATED (RazorpayX API called)
 *           → SUCCESS   (payout.processed webhook received)
 *           → FAILED    (payout.failed webhook or API error)
 *           → ON_HOLD   (admin freeze)
 *
 * One Payout per Booking (enforced at application layer).
 * Net amount = gross - TDS.  TCS is collected separately (platform liability).
 */
@Entity
@Table(
    name = "payouts",
    indexes = {
        @Index(name = "idx_payouts_booking", columnList = "booking_id"),
        @Index(name = "idx_payouts_owner",   columnList = "owner_id"),
        @Index(name = "idx_payouts_status",  columnList = "status")
    }
)
public class Payout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "booking_id", nullable = false, updatable = false)
    private UUID bookingId;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    /**
     * Gross amount before TDS deduction.
     * = rentalAmount + securityDeposit - damageCharges (if any).
     */
    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    /**
     * TDS withheld under Section 194-O (0.1% of gross).
     * Zero if owner's annual earnings are below ₹5 lakh threshold.
     */
    @Column(name = "tds_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal tdsAmount = BigDecimal.ZERO;

    /**
     * Net amount actually transferred = grossAmount − tdsAmount.
     * This is the amount sent to RazorpayX.
     */
    @Column(name = "net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PayoutStatus status = PayoutStatus.PENDING;

    /**
     * When the payout is scheduled to be executed.
     * Set to now() + 48h (T+2) at creation time.
     * PayoutEngine respects this — it won't trigger before scheduledAt.
     */
    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    /** Populated when RazorpayX webhook confirms payout.processed. */
    @Column(name = "executed_at")
    private Instant executedAt;

    /** Last known RazorpayX failure reason. Shown in admin payout dashboard. */
    @Column(name = "failure_reason")
    private String failureReason;

    /** RazorpayX payout ID (e.g. pout_xxxxx). Used for webhook reconciliation. */
    @Column(name = "rp_payout_id", length = 64)
    private String rpPayoutId;

    /**
     * RazorpayX fund account ID linked to the owner's OwnerPayoutAccount.
     * Stored here so the payout is self-contained for audit purposes even
     * if the owner changes their bank account later.
     */
    @Column(name = "fund_account_id", length = 64)
    private String fundAccountId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    // ── Constructors ─────────────────────────────────────────────────────────

    protected Payout() {}

    /**
     * Created by PayoutEngine once a booking is READY_FOR_PAYOUT.
     * Default scheduledAt = now + 48 hours (RBI T+2 settlement window).
     */
    public Payout(
        UUID bookingId,
        UUID ownerId,
        BigDecimal grossAmount,
        BigDecimal tdsAmount,
        BigDecimal netAmount,
        String fundAccountId
    ) {
        this.bookingId     = bookingId;
        this.ownerId       = ownerId;
        this.grossAmount   = grossAmount;
        this.tdsAmount     = tdsAmount;
        this.netAmount     = netAmount;
        this.fundAccountId = fundAccountId;
        this.scheduledAt   = Instant.now().plusSeconds(48L * 3_600); // T+2
    }

    // ── State transitions ─────────────────────────────────────────────────────

    /**
     * Called immediately after RazorpayX Payouts API returns success.
     * Sets status to INITIATED and stores the RazorpayX payout ID.
     */
    public void markInitiated(String rpPayoutId) {
        this.rpPayoutId = rpPayoutId;
        this.status     = PayoutStatus.INITIATED;
        this.updatedAt  = Instant.now();
    }

    /**
     * Called when payout.processed webhook is received from RazorpayX.
     */
    public void markSuccess() {
        this.status     = PayoutStatus.SUCCESS;
        this.executedAt = Instant.now();
        this.updatedAt  = Instant.now();
    }

    /**
     * Called when payout.failed webhook is received or on API error.
     * PayoutEngine will retry after a back-off period.
     */
    public void markFailed(String reason) {
        this.status        = PayoutStatus.FAILED;
        this.failureReason = reason;
        this.updatedAt     = Instant.now();
    }

    /**
     * Admin-initiated hold (fraud flag, compliance review).
     */
    public void putOnHold() {
        this.status    = PayoutStatus.ON_HOLD;
        this.updatedAt = Instant.now();
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()              { return id; }
    public UUID getBookingId()       { return bookingId; }
    public UUID getOwnerId()         { return ownerId; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getTdsAmount() { return tdsAmount; }
    public BigDecimal getNetAmount() { return netAmount; }
    public PayoutStatus getStatus()  { return status; }
    public Instant getScheduledAt()  { return scheduledAt; }
    public Instant getExecutedAt()   { return executedAt; }
    public String getRpPayoutId()    { return rpPayoutId; }
    public String getFundAccountId() { return fundAccountId; }
    public String getFailureReason() { return failureReason; }
    public Instant getCreatedAt()    { return createdAt; }
    public Instant getUpdatedAt()    { return updatedAt; }

    @Override
    public String toString() {
        return String.format(
            "Payout{id=%s, booking=%s, owner=%s, net=%s, status=%s}",
            id, bookingId, ownerId, netAmount, status
        );
    }
}
