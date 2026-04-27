package com.rentit.repository;

import com.rentit.model.LedgerTransaction;
import com.rentit.model.enums.LedgerAccount;
import com.rentit.model.enums.LedgerDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Append-only read/write access to the ledger.
 *
 * RULE: No delete or bulk update queries here.
 * The ledger is a permanent audit trail — rows are never modified post-insert.
 */
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, UUID> {

    // ── Booking-scoped queries ────────────────────────────────────────────────

    /**
     * Full ledger history for a booking in chronological order.
     * Used by admin dispute view and owner payout breakdown.
     */
    List<LedgerTransaction> findByBookingIdOrderByCreatedAtAsc(UUID bookingId);

    /**
     * Filter by account — useful for pulling all PLATFORM_FEE credits
     * across a booking for revenue reporting.
     */
    List<LedgerTransaction> findByBookingIdAndAccountOrderByCreatedAtAsc(
        UUID bookingId, LedgerAccount account
    );

    // ── Balance queries ───────────────────────────────────────────────────────

    /**
     * Sum all entries for a given account + direction for a booking.
     *
     * Used by LedgerService.netBalance() to compute:
     *   net = SUM(CREDIT) - SUM(DEBIT) for the account.
     *
     * Returns 0 (not null) if no entries exist — safe to use in arithmetic.
     */
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM   LedgerTransaction t
        WHERE  t.bookingId = :bookingId
          AND  t.account   = :account
          AND  t.direction = :direction
        """)
    BigDecimal sumByBookingAndAccountAndDirection(
        @Param("bookingId")  UUID bookingId,
        @Param("account")    LedgerAccount account,
        @Param("direction")  LedgerDirection direction
    );

    /**
     * Platform revenue report — total PLATFORM_FEE credits in a date range.
     * Used by admin finance dashboard.
     */
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM   LedgerTransaction t
        WHERE  t.account   = com.rentit.model.enums.LedgerAccount.PLATFORM_FEE
          AND  t.direction = com.rentit.model.enums.LedgerDirection.CREDIT
          AND  t.createdAt BETWEEN :from AND :to
        """)
    BigDecimal totalPlatformFeeRevenue(
        @Param("from") Instant from,
        @Param("to")   Instant to
    );

    /**
     * Total TDS withheld in a date range — needed for quarterly TDS filings.
     */
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM   LedgerTransaction t
        WHERE  t.account   = com.rentit.model.enums.LedgerAccount.TAX_TDS
          AND  t.direction = com.rentit.model.enums.LedgerDirection.CREDIT
          AND  t.createdAt BETWEEN :from AND :to
        """)
    BigDecimal totalTdsWithheld(
        @Param("from") Instant from,
        @Param("to")   Instant to
    );

    // ── Existence check ───────────────────────────────────────────────────────

    /**
     * Check if any ledger entries exist for a booking.
     * Used to verify a payment was actually recorded before triggering payout.
     */
    boolean existsByBookingId(UUID bookingId);

    // ── Test Helpers ──────────────────────────────────────────────────────────
    
    void deleteByBookingId(UUID bookingId);
    
    long countByBookingId(UUID bookingId);
    
    List<LedgerTransaction> findByBookingId(UUID bookingId);
}
