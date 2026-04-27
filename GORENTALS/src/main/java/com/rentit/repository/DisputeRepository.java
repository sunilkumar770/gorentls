package com.rentit.repository;

import com.rentit.model.Dispute;
import com.rentit.model.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for booking disputes.
 *
 * Key constraint: one active dispute per booking at a time.
 * DisputeService.openDispute() calls existsActiveForBooking()
 * before creating a new Dispute.
 */
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    // ── Active dispute guard ──────────────────────────────────────────────────

    /**
     * Returns true if an OPEN or UNDER_REVIEW dispute already exists
     * for this booking. Used to block duplicate dispute creation.
     */
    @Query("""
        SELECT COUNT(d) > 0 FROM Dispute d
        WHERE  d.bookingId = :bookingId
          AND  d.status IN (
              com.rentit.model.enums.DisputeStatus.OPEN,
              com.rentit.model.enums.DisputeStatus.UNDER_REVIEW
          )
        """)
    boolean existsActiveForBooking(@Param("bookingId") UUID bookingId);

    /**
     * Fetch the currently active dispute for a booking.
     * Returns empty if no dispute is open/under review.
     */
    @Query("""
        SELECT d FROM Dispute d
        WHERE  d.bookingId = :bookingId
          AND  d.status IN (
              com.rentit.model.enums.DisputeStatus.OPEN,
              com.rentit.model.enums.DisputeStatus.UNDER_REVIEW
          )
        """)
    Optional<Dispute> findActiveByBookingId(@Param("bookingId") UUID bookingId);

    // ── Lookup queries ────────────────────────────────────────────────────────

    /**
     * All disputes for a booking (historical + active).
     * Used in admin booking detail view.
     */
    List<Dispute> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);

    void deleteByBookingId(UUID bookingId);

    /**
     * All disputes opened by a specific user.
     * Used in renter / owner "My Disputes" screen.
     */
    List<Dispute> findByOpenedByOrderByCreatedAtDesc(UUID openedBy);

    // ── Admin queue queries ───────────────────────────────────────────────────

    /**
     * Admin review queue — disputes in OPEN or UNDER_REVIEW status,
     * oldest first (FIFO processing).
     */
    @Query("""
        SELECT d FROM Dispute d
        WHERE  d.status IN (
            com.rentit.model.enums.DisputeStatus.OPEN,
            com.rentit.model.enums.DisputeStatus.UNDER_REVIEW
        )
        ORDER  BY d.createdAt ASC
        """)
    List<Dispute> findAdminQueue();

    /**
     * Escalation alert — disputes that have been OPEN for more than
     * the given threshold without being picked up for review.
     * SLA target: disputes should be picked up within 4 hours.
     */
    @Query("""
        SELECT d FROM Dispute d
        WHERE  d.status    = com.rentit.model.enums.DisputeStatus.OPEN
          AND  d.createdAt < :threshold
        ORDER  BY d.createdAt ASC
        """)
    List<Dispute> findStaleOpenDisputes(@Param("threshold") Instant threshold);

    // ── Reporting ─────────────────────────────────────────────────────────────

    /** Count by status — for admin dashboard KPI. */
    long countByStatus(DisputeStatus status);

    /**
     * Count disputes opened against a specific owner's bookings.
     * Used to compute owner dispute rate for fraud scoring.
     */
    @Query("""
        SELECT COUNT(d) FROM Dispute d
        JOIN   Booking b ON b.id = d.bookingId
        JOIN   b.listing l
        WHERE  l.owner.id  = :ownerId
          AND  d.status  != com.rentit.model.enums.DisputeStatus.REJECTED
        """)
    long countNonRejectedByOwnerId(@Param("ownerId") UUID ownerId);
}
