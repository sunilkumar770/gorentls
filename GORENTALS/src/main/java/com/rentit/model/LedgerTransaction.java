package com.rentit.model;

import com.rentit.model.enums.LedgerAccount;
import com.rentit.model.enums.LedgerDirection;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * One row of the double-entry internal ledger.
 *
 * RULE: LedgerService.post() always creates exactly two rows per event —
 * one DEBIT + one CREDIT of identical amount. Never create this entity
 * directly — always go through LedgerService.
 *
 * This table is append-only. No UPDATE or DELETE is ever issued against it.
 * It is the permanent audit trail of every money movement on the platform.
 */
@Entity
@Table(
    name = "ledger_transactions",
    indexes = {
        @Index(name = "idx_ledger_booking", columnList = "booking_id"),
        @Index(name = "idx_ledger_account", columnList = "account, direction")
    }
)
public class LedgerTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /**
     * The booking this entry belongs to.
     * Not a FK constraint here — kept loose to allow ledger queries
     * without joining the full Booking graph.
     */
    @Column(name = "booking_id", nullable = false, updatable = false)
    private UUID bookingId;

    /**
     * The PG payment that triggered this entry (nullable for internal transfers
     * such as moving money from RENTER_ESCROW to OWNER_ESCROW at payout time).
     */
    @Column(name = "payment_id", updatable = false)
    private UUID paymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "account", nullable = false, length = 24, updatable = false)
    private LedgerAccount account;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 8, updatable = false)
    private LedgerDirection direction;

    /**
     * Always positive. The sign is expressed by {@link #direction}.
     * Stored at 2dp HALF_UP — matches PricingCalculator rounding.
     */
    @Column(nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 3, updatable = false)
    private String currency = "INR";

    /** Human-readable audit reason. Shown in admin dispute views. */
    @Column(updatable = false)
    private String reason;

    /**
     * Optional structured metadata — e.g. razorpay_payout_id, tds_pan_ref.
     * Stored as JSONB; queryable in PostgreSQL.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", updatable = false)
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // ── Constructors ─────────────────────────────────────────────────────────

    protected LedgerTransaction() {}

    /**
     * Primary constructor used by LedgerService.post().
     */
    public LedgerTransaction(
        UUID bookingId,
        UUID paymentId,
        LedgerAccount account,
        LedgerDirection direction,
        BigDecimal amount,
        String reason
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException(
                "LedgerTransaction amount must be positive, got: " + amount);

        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.account   = account;
        this.direction = direction;
        this.amount    = amount;
        this.reason    = reason;
    }

    /** Convenience constructor with metadata. */
    public LedgerTransaction(
        UUID bookingId,
        UUID paymentId,
        LedgerAccount account,
        LedgerDirection direction,
        BigDecimal amount,
        String reason,
        Map<String, Object> metadata
    ) {
        this(bookingId, paymentId, account, direction, amount, reason);
        this.metadata = metadata;
    }

    // ── Getters (no setters — ledger rows are immutable after creation) ──────

    public UUID getId()                  { return id; }
    public UUID getBookingId()           { return bookingId; }
    public UUID getPaymentId()           { return paymentId; }
    public LedgerAccount getAccount()    { return account; }
    public LedgerDirection getDirection(){ return direction; }
    public BigDecimal getAmount()        { return amount; }
    public String getCurrency()          { return currency; }
    public String getReason()            { return reason; }
    public Map<String, Object> getMetadata() { return metadata; }
    public Instant getCreatedAt()        { return createdAt; }

    @Override
    public String toString() {
        return String.format(
            "LedgerTransaction{id=%s, booking=%s, %s %s %s %s, reason='%s'}",
            id, bookingId, direction, account, amount, currency, reason
        );
    }
}
