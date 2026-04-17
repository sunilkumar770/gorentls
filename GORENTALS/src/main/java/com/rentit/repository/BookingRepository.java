package com.rentit.repository;

import com.rentit.model.Booking;
import com.rentit.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
	
	
	// Add this method to BookingRepository.java
	@Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt < :date")
	long countByCreatedAtBefore(@Param("date") LocalDateTime date);
    
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.listing.id = :listingId
        AND b.status NOT IN ('CANCELLED', 'REJECTED')
        AND b.startDate < :endDate
        AND b.endDate > :startDate
        """)
    boolean existsOverlappingBooking(
        @Param("listingId")  UUID      listingId,
        @Param("startDate")  LocalDate startDate,
        @Param("endDate")    LocalDate endDate
    );
    
    /**
     * Find bookings by renter ID
     */
    Page<Booking> findByRenterId(UUID renterId, Pageable pageable);
    
    /**
     * Find bookings by listing ID
     */
    Page<Booking> findByListingId(UUID listingId, Pageable pageable);
    
    /**
     * Find bookings by owner ID (through listing)
     */
    @Query("SELECT b FROM Booking b WHERE b.listing.owner.id = :ownerId ORDER BY b.createdAt DESC")
    Page<Booking> findByOwnerId(@Param("ownerId") UUID ownerId, Pageable pageable);
    
    /**
     * Find bookings by status
     */
    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);
    
    /**
     * Count bookings by status
     */
    long countByStatus(BookingStatus status);
    
    /**
     * Find bookings by renter and status
     */
    Page<Booking> findByRenterIdAndStatus(UUID renterId, BookingStatus status, Pageable pageable);
    
    /**
     * Find bookings by owner and status
     */
    @Query("SELECT b FROM Booking b WHERE b.listing.owner.id = :ownerId AND b.status = :status ORDER BY b.createdAt DESC")
    Page<Booking> findByOwnerIdAndStatus(@Param("ownerId") UUID ownerId, @Param("status") BookingStatus status, Pageable pageable);
    
    /**
     * Check if listing is available for given dates
     */
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.listing.id = :listingId " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS') " +
           "AND ((b.startDate <= :endDate AND b.endDate >= :startDate))")
    boolean isListingBooked(@Param("listingId") UUID listingId, 
                           @Param("startDate") LocalDate startDate, 
                           @Param("endDate") LocalDate endDate);
    
    /**
     * Find conflicting bookings for a listing
     */
    @Query("SELECT b FROM Booking b WHERE b.listing.id = :listingId " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS') " +
           "AND ((b.startDate <= :endDate AND b.endDate >= :startDate))")
    List<Booking> findConflictingBookings(@Param("listingId") UUID listingId,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);
    
    /**
     * Count bookings created after a date
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt >= :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
    
    /**
     * Count bookings created between dates
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    /**
     * Get average booking value (total amount)
     */
    @Query("SELECT AVG(b.totalAmount) FROM Booking b WHERE b.status = 'COMPLETED'")
    Double getAverageBookingValue();
    
    /**
     * Get average rental days
     */
    @Query("SELECT AVG(b.totalDays) FROM Booking b WHERE b.status = 'COMPLETED'")
    Double getAverageRentalDays();
    
    /**
     * Get total revenue from completed bookings
     */
    @Query("SELECT SUM(b.totalAmount) FROM Booking b WHERE b.status = 'COMPLETED'")
    Double getTotalRevenue();
    
    /**
     * Get bookings for a specific date range
     */
    @Query("SELECT b FROM Booking b WHERE b.startDate <= :endDate AND b.endDate >= :startDate")
    List<Booking> findBookingsInDateRange(@Param("startDate") LocalDate startDate, 
                                         @Param("endDate") LocalDate endDate);
    
    /**
     * Get upcoming bookings for a user (renter)
     */
    @Query("SELECT b FROM Booking b WHERE b.renter.id = :renterId " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS') " +
           "AND b.startDate >= :currentDate ORDER BY b.startDate ASC")
    List<Booking> findUpcomingBookingsByRenter(@Param("renterId") UUID renterId,
                                               @Param("currentDate") LocalDate currentDate);
    
    /**
     * Get upcoming bookings for an owner
     */
    @Query("SELECT b FROM Booking b WHERE b.listing.owner.id = :ownerId " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS') " +
           "AND b.startDate >= :currentDate ORDER BY b.startDate ASC")
    List<Booking> findUpcomingBookingsByOwner(@Param("ownerId") UUID ownerId,
                                             @Param("currentDate") LocalDate currentDate);
    
    /**
     * Get recent bookings for dashboard
     */
    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
    Page<Booking> findRecentBookings(Pageable pageable);
    
    /**
     * Get monthly booking count for chart
     */
    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', b.createdAt) as month, COUNT(b) " +
           "FROM Booking b WHERE b.createdAt >= :startDate " +
           "GROUP BY FUNCTION('DATE_TRUNC', 'month', b.createdAt) ORDER BY month DESC")
    List<Object[]> getMonthlyBookingCount(@Param("startDate") LocalDateTime startDate);
    
    /**
     * Get bookings by listing for availability calendar
     */
    @Query("SELECT b FROM Booking b WHERE b.listing.id = :listingId " +
           "AND b.status IN ('CONFIRMED', 'IN_PROGRESS') " +
           "ORDER BY b.startDate ASC")
    List<Booking> findBookedDatesForListing(@Param("listingId") UUID listingId);
}