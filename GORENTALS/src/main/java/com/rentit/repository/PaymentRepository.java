package com.rentit.repository;

import com.rentit.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    
    /**
     * Find payment by Razorpay order ID
     */
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    
    /**
     * Find payment by Razorpay payment ID
     */
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    
    /**
     * Find payment by booking ID
     */
    Optional<Payment> findByBookingId(UUID bookingId);
    
    /**
     * Find all payments by status
     */
    Page<Payment> findByStatus(String status, Pageable pageable);
    
    /**
     * Find all payments by payment type
     */
    Page<Payment> findByPaymentType(String paymentType, Pageable pageable);
    
    /**
     * Sum of all completed payments
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED'")
    BigDecimal sumCompletedPayments();
    
    /**
     * Sum of payments by date range
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt BETWEEN :start AND :end")
    BigDecimal sumPaymentsByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    /**
     * Sum of payments by booking ID
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.booking.id = :bookingId AND p.status = 'COMPLETED'")
    BigDecimal sumPaymentsByBookingId(@Param("bookingId") UUID bookingId);
    
    /**
     * Count payments by status
     */
    long countByStatus(String status);
    
    /**
     * Find payments by user (renter)
     */
    @Query("SELECT p FROM Payment p WHERE p.booking.renter.id = :userId ORDER BY p.createdAt DESC")
    Page<Payment> findByRenterId(@Param("userId") UUID userId, Pageable pageable);
    
    /**
     * Find payments by owner
     */
    @Query("SELECT p FROM Payment p WHERE p.booking.listing.owner.id = :ownerId ORDER BY p.createdAt DESC")
    Page<Payment> findByOwnerId(@Param("ownerId") UUID ownerId, Pageable pageable);
    
    /**
     * Get total revenue for a specific owner
     */
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.booking.listing.owner.id = :ownerId AND p.status = 'COMPLETED'")
    BigDecimal getTotalRevenueForOwner(@Param("ownerId") UUID ownerId);
    
    /**
     * Get monthly revenue for chart data
     */
    @Query("SELECT FUNCTION('DATE_TRUNC', 'month', p.createdAt) as month, SUM(p.amount) " +
           "FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt >= :startDate " +
           "GROUP BY FUNCTION('DATE_TRUNC', 'month', p.createdAt) ORDER BY month DESC")
    List<Object[]> getMonthlyRevenue(@Param("startDate") LocalDateTime startDate);
    
    /**
     * Get daily revenue for chart data
     */
    @Query("SELECT FUNCTION('DATE_TRUNC', 'day', p.createdAt) as day, SUM(p.amount) " +
           "FROM Payment p WHERE p.status = 'COMPLETED' AND p.createdAt >= :startDate " +
           "GROUP BY FUNCTION('DATE_TRUNC', 'day', p.createdAt) ORDER BY day DESC")
    List<Object[]> getDailyRevenue(@Param("startDate") LocalDateTime startDate);
    
 
}