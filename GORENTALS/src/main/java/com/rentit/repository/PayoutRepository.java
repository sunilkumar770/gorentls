package com.rentit.repository;

import com.rentit.model.Payout;
import com.rentit.model.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for outgoing owner payouts.
 *
 * PayoutEngine uses findDueForExecution() as its polling query.
 * Admin dashboard uses findByOwnerId() and findByStatus().
 */
public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    // ── PayoutEngine polling ──────────────────────────────────────────────────

    /**
     * Core PayoutEngine query — returns all payouts that:
     *   1. Have status PENDING (never attempted yet)
     *   2. Are past their scheduledAt time (T+2 window has elapsed)
     *
     * Called by @Scheduled every 15 minutes.
     * Results are processed in order of scheduledAt (oldest first).
     */
    @Query("""
        SELECT p FROM Payout p
        WHERE  p.status      = com.rentit.model.enums.PayoutStatus.PENDING
          AND  p.scheduledAt <= :now
        ORDER  BY p.scheduledAt ASC
        """)
    List<Payout> findDueForExecution(@Param("now") Instant now);

    /**
     * Retry query — returns FAILED payouts that are eligible for retry.
     * PayoutEngine retries failed payouts up to 3 attempts with exponential back-off.
     * (Retry logic tracks attempt count in metadata — not added here to keep scope minimal.)
     */
    @Query("""
        SELECT p FROM Payout p
        WHERE  p.status = com.rentit.model.enums.PayoutStatus.FAILED
          AND  p.scheduledAt <= :now
        ORDER  BY p.updatedAt ASC
        """)
    List<Payout> findFailedForRetry(@Param("now") Instant now);

    // ── Lookup queries ────────────────────────────────────────────────────────

    /**
     * One payout per booking — check before creating a new one.
     */
    Optional<Payout> findByBookingId(UUID bookingId);

    boolean existsByBookingId(UUID bookingId);

    void deleteByBookingId(UUID bookingId);

    /**
     * All payouts for an owner — for owner earnings dashboard.
     * Ordered newest first.
     */
    List<Payout> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    /**
     * Filter by status — used by admin payout management panel.
     */
    List<Payout> findByStatusOrderByScheduledAtAsc(PayoutStatus status);

    /**
     * Reconciliation — find payout by RazorpayX payout ID.
     * Used by webhook handler to match incoming payout.processed / payout.failed events.
     */
    Optional<Payout> findByRpPayoutId(String rpPayoutId);

    // ── Reporting ─────────────────────────────────────────────────────────────

    /**
     * Count of payouts by status — for admin dashboard KPI widget.
     */
    long countByStatus(PayoutStatus status);

    /**
     * Compute owner's total successful payouts in the current Indian financial year
     */
    @Query("""
        SELECT COALESCE(SUM(p.grossAmount), 0)
        FROM   Payout p
        WHERE  p.ownerId   = :ownerId
          AND  p.status    = com.rentit.model.enums.PayoutStatus.SUCCESS
          AND  p.executedAt >= :yearStart
        """)
    java.math.BigDecimal sumSuccessfulPayoutsForOwnerInYear(
        @Param("ownerId")    UUID ownerId,
        @Param("yearStart")  Instant yearStart
    );
}
