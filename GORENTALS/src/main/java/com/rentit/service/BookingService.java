package com.rentit.service;

import com.rentit.dto.BookingRequest;
import com.rentit.dto.BookingResponse;
import com.rentit.dto.ListingResponse;
import com.rentit.dto.UserResponse;
import com.rentit.model.*;
import com.rentit.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private ListingRepository listingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private BlockedDateRepository blockedDateRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Create a new booking request
     */
    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userEmail) {
        // Get the user (renter)
        User renter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get the listing
        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        // Check if listing is available
        if (!listing.getIsAvailable() || !listing.getIsPublished()) {
            throw new RuntimeException("Listing is not available for booking");
        }
        
        // Check if listing is owned by the same user
        if (listing.getOwner().getId().equals(renter.getId())) {
            throw new RuntimeException("You cannot book your own listing");
        }
        
        // Validate dates
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        
        if (startDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Start date cannot be in the past");
        }
        
        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date must be after start date");
        }
        
        // Check for conflicting bookings (both in bookings and blocked_dates table)
        boolean isBooked = bookingRepository.isListingBooked(listing.getId(), startDate, endDate);
        boolean isBlocked = blockedDateRepository.isDateRangeBlocked(listing.getId(), startDate, endDate);

        if (isBooked || isBlocked) {
            // Blocker 4: Use 409 Conflict logic (handled by throwing exception here, controller/frontend must catch)
            throw new IllegalStateException("These dates are not available");
        }
        
        // Calculate total days and amount
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate);
        BigDecimal rentalAmount = listing.getPricePerDay().multiply(BigDecimal.valueOf(totalDays));
        BigDecimal securityDeposit = listing.getSecurityDeposit() != null ? 
                listing.getSecurityDeposit() : BigDecimal.ZERO;
        BigDecimal totalAmount = rentalAmount.add(securityDeposit);
        
        // Create booking
        Booking booking = new Booking();
        booking.setListing(listing);
        booking.setRenter(renter);
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setTotalDays((int) totalDays);
        booking.setRentalAmount(rentalAmount);
        booking.setSecurityDeposit(securityDeposit);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.PENDING);
        booking.setPaymentStatus("PENDING");
        booking.setCreatedAt(LocalDateTime.now());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Send notification to owner
        notificationService.sendNotification(
            listing.getOwner().getId(),
            "New Booking Request",
            String.format("You have a new booking request for %s from %s", 
                listing.getTitle(), renter.getFullName()),
            "BOOKING_REQUEST"
        );
        
        return mapToBookingResponse(savedBooking);
    }

    /**
     * Get booking by ID
     */
    public BookingResponse getBookingById(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        return mapToBookingResponse(booking);
    }

    /**
     * Get bookings by user (renter)
     */
    public Page<BookingResponse> getBookingsByUser(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Page<Booking> bookings = bookingRepository.findByRenterId(user.getId(), pageable);
        return bookings.map(this::mapToBookingResponse);
    }

    /**
     * Get bookings for owner
     */
    public Page<BookingResponse> getBookingsForOwner(String ownerEmail, Pageable pageable) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Check if user is actually an owner
        if (owner.getUserType() != User.UserType.OWNER) {
            throw new org.springframework.security.access.AccessDeniedException(
              "User is not an owner");
        }
        
        Page<Booking> bookings = bookingRepository.findByOwnerId(owner.getId(), pageable);
        return bookings.map(this::mapToBookingResponse);
    }

    /**
     * Cancel booking
     */
    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is either renter or owner
        boolean isRenter = booking.getRenter().getId().equals(user.getId());
        boolean isOwner = booking.getListing().getOwner().getId().equals(user.getId());
        
        if (!isRenter && !isOwner) {
            throw new RuntimeException("You are not authorized to cancel this booking");
        }
        
        // Check if booking can be cancelled
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed booking");
        }
        
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }
        
        // Update status
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Process refund if payment was completed
        if ("COMPLETED".equals(booking.getPaymentStatus())) {
            // TODO: Implement refund logic
            notificationService.sendNotification(
                booking.getRenter().getId(),
                "Booking Cancelled - Refund Initiated",
                String.format("Your booking for %s has been cancelled. Refund will be processed shortly.",
                    booking.getListing().getTitle()),
                "REFUND_INITIATED"
            );
        }
        
        // Send notification
        UUID notifyUserId = isRenter ? booking.getListing().getOwner().getId() : booking.getRenter().getId();
        notificationService.sendNotification(
            notifyUserId,
            "Booking Cancelled",
            String.format("Booking for %s has been cancelled by %s",
                booking.getListing().getTitle(),
                user.getFullName()),
            "BOOKING_CANCELLED"
        );
        
        return mapToBookingResponse(savedBooking);
    }  // <-- THIS CLOSING BRACE WAS MISSING

    /**
     * Accept booking (by owner)
     */
    @Transactional
    public BookingResponse acceptBooking(UUID bookingId, String ownerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Verify owner owns the listing
        if (!booking.getListing().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("You are not authorized to accept this booking");
        }
        
        // Check if booking can be accepted
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking cannot be accepted in current status: " + booking.getStatus());
        }
        
        // Update status
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Send notification to renter
        notificationService.sendNotification(
            booking.getRenter().getId(),
            "Booking Accepted",
            String.format("Your booking for %s has been accepted by the owner. Please complete the payment.",
                booking.getListing().getTitle()),
            "BOOKING_ACCEPTED"
        );
        
        return mapToBookingResponse(savedBooking);
    }

    /**
     * Reject booking (by owner)
     */
    @Transactional
    public BookingResponse rejectBooking(UUID bookingId, String ownerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Verify owner owns the listing
        if (!booking.getListing().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("You are not authorized to reject this booking");
        }
        
        // Check if booking can be rejected
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking cannot be rejected in current status: " + booking.getStatus());
        }
        
        // Update status
        booking.setStatus(BookingStatus.REJECTED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Send notification to renter
        notificationService.sendNotification(
            booking.getRenter().getId(),
            "Booking Rejected",
            String.format("Your booking for %s has been rejected by the owner.",
                booking.getListing().getTitle()),
            "BOOKING_REJECTED"
        );
        
        return mapToBookingResponse(savedBooking);
    }

    /**
     * Complete booking (after return)
     */
    @Transactional
    public BookingResponse completeBooking(UUID bookingId, String ownerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Verify owner owns the listing
        if (!booking.getListing().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("You are not authorized to complete this booking");
        }
        
        // Check if booking can be completed
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Booking cannot be completed in current status: " + booking.getStatus());
        }
        
        // Update status
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setUpdatedAt(LocalDateTime.now());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Process security deposit refund
        if (booking.getSecurityDeposit().compareTo(BigDecimal.ZERO) > 0) {
            // TODO: Implement deposit refund logic
            notificationService.sendNotification(
                booking.getRenter().getId(),
                "Booking Completed - Deposit Refund",
                String.format("Your booking for %s has been completed. Security deposit of ₹%s will be refunded shortly.",
                    booking.getListing().getTitle(),
                    booking.getSecurityDeposit()),
                "DEPOSIT_REFUND"
            );
        }
        
        // Send notification to renter
        notificationService.sendNotification(
            booking.getRenter().getId(),
            "Booking Completed",
            String.format("Your booking for %s has been completed. Thank you for renting with us!",
                booking.getListing().getTitle()),
            "BOOKING_COMPLETED"
        );
        
        return mapToBookingResponse(savedBooking);
    }

    /**
     * Get upcoming bookings for renter
     */
    public List<BookingResponse> getUpcomingBookingsForRenter(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Booking> bookings = bookingRepository.findUpcomingBookingsByRenter(
            user.getId(), LocalDate.now());
        
        return bookings.stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get upcoming bookings for owner
     */
    public List<BookingResponse> getUpcomingBookingsForOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        List<Booking> bookings = bookingRepository.findUpcomingBookingsByOwner(
            owner.getId(), LocalDate.now());
        
        return bookings.stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Check if listing is available for dates
     */
    public boolean isListingAvailable(UUID listingId, LocalDate startDate, LocalDate endDate) {
        return !bookingRepository.isListingBooked(listingId, startDate, endDate);
    }

    /**
     * Map Booking entity to BookingResponse DTO
     */
    private BookingResponse mapToBookingResponse(Booking booking) {
        User renter = booking.getRenter();
        User owner = booking.getListing().getOwner();
        
        return BookingResponse.builder()
                .id(booking.getId())
                .listing(ListingResponse.builder()
                        .id(booking.getListing().getId())
                        .title(booking.getListing().getTitle())
                        .pricePerDay(booking.getListing().getPricePerDay())
                        .images(booking.getListing().getImages())
                        .build())
                .renter(UserResponse.builder()
                        .id(renter.getId())
                        .fullName(renter.getFullName())
                        .email(renter.getEmail())
                        .phone(renter.getPhone())
                        .build())
                .owner(UserResponse.builder()
                        .id(owner.getId())
                        .fullName(owner.getFullName())
                        .email(owner.getEmail())
                        .phone(owner.getPhone())
                        .build())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .totalDays(booking.getTotalDays())
                .rentalAmount(booking.getRentalAmount())
                .securityDeposit(booking.getSecurityDeposit())
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus().name())
                .paymentStatus(booking.getPaymentStatus())
                .razorpayOrderId(booking.getRazorpayOrderId())
                .razorpayPaymentId(booking.getRazorpayPaymentId())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
    /**
     * Central status transition method. Called by all PATCH action endpoints.
     * Validates caller authorization and enforces the state machine.
     */
    @Transactional
    public BookingResponse updateStatus(UUID bookingId, BookingStatus newStatus, String callerEmail) {

        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        User caller = userRepository.findByEmail(callerEmail)
            .orElseThrow(() -> new RuntimeException("User not found: " + callerEmail));

        boolean isOwner  = booking.getListing().getOwner().getEmail().equals(callerEmail);
        boolean isRenter = booking.getRenter().getEmail().equals(callerEmail);
        boolean isAdmin  = caller.getUserType() == User.UserType.ADMIN;

        // ── Authorization matrix ─────────────────────────────────────────────────
        switch (newStatus) {
            case ACCEPTED:
            case REJECTED:
            case COMPLETED:
                if (!isOwner && !isAdmin)
                    throw new org.springframework.security.access.AccessDeniedException(
                        "Only the listing owner can perform this action.");
                break;
            case CANCELLED:
                if (!isOwner && !isRenter && !isAdmin)
                    throw new org.springframework.security.access.AccessDeniedException(
                        "Not authorized to cancel this booking.");
                break;
            default:
                throw new IllegalArgumentException("Unsupported direct status transition to: " + newStatus);
        }

        // ── State machine guard ───────────────────────────────────────────────────
        BookingStatus current = booking.getStatus();
        boolean validTransition = switch (current) {
            case PENDING     -> newStatus == BookingStatus.ACCEPTED
                             || newStatus == BookingStatus.REJECTED
                             || newStatus == BookingStatus.CANCELLED;
            case ACCEPTED    -> newStatus == BookingStatus.CONFIRMED
                             || newStatus == BookingStatus.COMPLETED
                             || newStatus == BookingStatus.CANCELLED;
            case CONFIRMED   -> newStatus == BookingStatus.IN_PROGRESS
                             || newStatus == BookingStatus.COMPLETED
                             || newStatus == BookingStatus.CANCELLED;
            case IN_PROGRESS -> newStatus == BookingStatus.COMPLETED
                             || newStatus == BookingStatus.CANCELLED;
            default          -> false; // COMPLETED, REJECTED, CANCELLED are terminal
        };

        if (!validTransition)
            throw new IllegalStateException(
                "Invalid booking transition: " + current + " → " + newStatus
                + ". Booking ID: " + bookingId);

        // ── Handle Blocked Dates (Idempotent) ──────────────────────────────────────
        if (newStatus == BookingStatus.ACCEPTED || newStatus == BookingStatus.CONFIRMED) {
            // Block dates
            if (blockedDateRepository.findByListing_IdAndBooking_Id(booking.getListing().getId(), booking.getId()).isEmpty()) {
                BlockedDate bd = new BlockedDate();
                bd.setListing(booking.getListing());
                bd.setBooking(booking);
                bd.setStartDate(booking.getStartDate());
                bd.setEndDate(booking.getEndDate());
                bd.setReason("BOOKING");
                blockedDateRepository.save(bd);
            }
        } else if (newStatus == BookingStatus.CANCELLED || newStatus == BookingStatus.REJECTED) {
            // Unblock dates
            blockedDateRepository.deleteByListing_IdAndBooking_Id(booking.getListing().getId(), booking.getId());
        }

        booking.setStatus(newStatus);
        booking.setUpdatedAt(java.time.LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        return mapToBookingResponse(saved);
    }
}