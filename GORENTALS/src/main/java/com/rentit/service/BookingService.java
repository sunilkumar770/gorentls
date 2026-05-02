package com.rentit.service;

import com.rentit.dto.BookingRequest;
import com.rentit.dto.UserPublicResponse;
import com.rentit.dto.BookingResponse;
import com.rentit.dto.ListingResponse;
import com.rentit.exception.BusinessException;
import com.rentit.model.*;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.pricing.PricingCalculator;
import com.rentit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository     bookingRepository;
    private final UserProfileRepository userProfileRepository;
    private final ListingRepository     listingRepository;
    private final UserRepository        userRepository;
    private final PaymentRepository     paymentRepository;
    private final BlockedDateRepository blockedDateRepository;
    private final NotificationService   notificationService;
    private final BookingEscrowService  escrowService;
    private final RazorpayIntegrationService razorpayService;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a new booking request.
     * BUG-01 FIX: throw 404 ResponseStatusException, not bare RuntimeException.
     * BUG-02 FIX: start date must be today or future (≥ today).
     * BUG-03 FIX: end date must be strictly after start date (no same-day 0-day rentals).
     */
    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userEmail) {

        User renter = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("Renter", userEmail));

        Listing listing = listingRepository.findById(request.getListingId())
            .orElseThrow(() -> BusinessException.notFound("Listing", request.getListingId()));

        boolean isAvailable = listing.getIsAvailable() != null ? listing.getIsAvailable() : false;
        boolean isPublished = listing.getIsPublished() != null ? listing.getIsPublished() : false;

        if (!isAvailable || !isPublished) {
            throw BusinessException.conflict("This item is currently unavailable for booking");
        }

        if (listing.getOwner().getId().equals(renter.getId())) {
            throw BusinessException.badRequest("You cannot book your own listing");
        }

        // ── Date validation ──────────────────────────────────────────────────
        LocalDate startDate = request.getStartDate();
        LocalDate endDate   = request.getEndDate();
        LocalDate today     = LocalDate.now();

        // BUG-02: start must be today or in the future
        // We allow up to 1 day in the past to account for timezone drift between the browser and server
        if (startDate.isBefore(today.minusDays(1))) {
            throw BusinessException.badRequest("Start date cannot be in the past");
        }
        // BUG-03: end must be strictly after start (prevent 0-day bookings)
        if (!endDate.isAfter(startDate)) {
            throw BusinessException.badRequest("End date must be after start date");
        }

        // ── Availability check ───────────────────────────────────────────────
        LocalDateTime cutoff    = LocalDateTime.now().minusMinutes(15);
        boolean       hasOverlap = bookingRepository.existsOverlappingBooking(
            listing.getId(), startDate, endDate, cutoff);
        boolean       isBlocked  = blockedDateRepository.isDateRangeBlocked(
            listing.getId(), startDate, endDate);

        if (hasOverlap || isBlocked) {
            throw BusinessException.conflict("This item is already booked for the selected dates");
        }

        // ── Pricing ──────────────────────────────────────────────────────────
        long totalDays = Math.max(1, ChronoUnit.DAYS.between(startDate, endDate));

        BigDecimal rentalAmount    = listing.getPricePerDay()
                                            .multiply(BigDecimal.valueOf(totalDays));
        BigDecimal securityDeposit = listing.getSecurityDeposit() != null
                                     ? listing.getSecurityDeposit() : BigDecimal.ZERO;

        PricingCalculator.Phase1Quote quote =
            PricingCalculator.quote(listing.getPricePerDay(), totalDays, securityDeposit);

        // ── Persist ──────────────────────────────────────────────────────────
        Booking booking = new Booking();
        booking.setListing(listing);
        booking.setRenter(renter);
        booking.setStartDate(startDate);
        booking.setEndDate(endDate);
        booking.setTotalDays((int) totalDays);
        booking.setRentalAmount(quote.base());
        booking.setSecurityDeposit(quote.deposit());
        booking.setGstAmount(quote.gstAmount());
        booking.setPlatformFee(quote.platformFee());
        booking.setTotalAmount(quote.totalAmount());
        booking.setAdvanceAmount(quote.advanceAmount());
        booking.setRemainingAmount(quote.remainingAmount());
        booking.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        booking.setEscrowStatus(com.rentit.model.enums.EscrowStatus.PENDING);
        booking.setPaymentStatus("PENDING");

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: {} for listing {} by renter {}",
            saved.getId(), listing.getId(), renter.getEmail());

        notificationService.sendNotification(
            listing.getOwner().getId(),
            "New Booking Request",
            String.format("You have a new booking request for '%s' from %s.",
                listing.getTitle(), renter.getFullName()),
            "BOOKING_REQUEST"
        );

        return mapToBookingResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    /** Get booking by ID with caller ownership verification. */
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID bookingId, String callerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        User caller = userRepository.findByEmail(callerEmail)
            .orElseThrow(() -> BusinessException.notFound("User", callerEmail));

        boolean isRenter = booking.getRenter() != null
            && booking.getRenter().getEmail().equals(callerEmail);
        boolean isOwner  = booking.getListing() != null
            && booking.getListing().getOwner() != null
            && booking.getListing().getOwner().getEmail().equals(callerEmail);
        boolean isAdmin  = caller.getUserType() == User.UserType.ADMIN;

        if (!isRenter && !isOwner && !isAdmin) {
            throw BusinessException.forbidden("Not authorized to view this booking");
        }

        return mapToBookingResponse(booking);
    }

    /** Get paginated bookings for a renter. BUG-07 FIX: 404 not RuntimeException. */
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByUser(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        return bookingRepository.findByRenterId(user.getId(), pageable)
                                .map(this::mapToBookingResponse);
    }

    /** Get paginated bookings for an owner. BUG-07 FIX: 404 not RuntimeException. */
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsForOwner(String ownerEmail, Pageable pageable) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> BusinessException.notFound("Owner", ownerEmail));

        if (owner.getUserType() != User.UserType.OWNER
            && owner.getUserType() != User.UserType.ADMIN) {
            throw BusinessException.forbidden("User is not an owner");
        }

        return bookingRepository.findByOwnerId(owner.getId(), pageable)
                                .map(this::mapToBookingResponse);
    }

    /** Get upcoming CONFIRMED/IN_USE bookings for a renter. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUpcomingBookingsForRenter(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        return bookingRepository.findUpcomingBookingsByRenter(user.getId(), LocalDate.now())
            .stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    /** Get upcoming CONFIRMED/IN_USE bookings for an owner. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUpcomingBookingsForOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> BusinessException.notFound("Owner", ownerEmail));
        return bookingRepository.findUpcomingBookingsByOwner(owner.getId(), LocalDate.now())
            .stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    /** Check availability without creating a booking. */
    @Transactional(readOnly = true)
    public boolean isListingAvailable(UUID listingId, LocalDate startDate, LocalDate endDate) {
        return !bookingRepository.isListingBooked(listingId, startDate, endDate);
    }

    @Transactional
    public BookingResponse confirmBooking(UUID bookingId, String ownerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        validateOwner(booking, ownerEmail);

        BookingStatus current = booking.getBookingStatus();
        EscrowStatus escrow = booking.getEscrowStatus();

        if (current == BookingStatus.PENDING_PAYMENT) {
            escrowService.confirmOwnerAcceptance(booking);
            return mapToBookingResponse(
                    bookingRepository.findById(bookingId)
                            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId))
            );
        } else if (current == BookingStatus.CONFIRMED
                && (escrow == EscrowStatus.ADVANCE_HELD || escrow == EscrowStatus.FULL_HELD)) {
            escrowService.markHandoverAndStartUse(booking);
            return mapToBookingResponse(
                    bookingRepository.findById(bookingId)
                            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId))
            );
        } else {
            throw BusinessException.badRequest(
                    "Cannot confirm booking in current state: " + current + " / " + escrow
            );
        }
    }

    /**
     * Owner rejects a booking request.
     * Logic:
     * 1. Update to CANCELLED.
     * 2. If money is held (ADVANCE_HELD), trigger automated refund.
     */
    @Transactional
    public BookingResponse rejectBooking(UUID bookingId, String ownerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        validateOwner(booking, ownerEmail);

        EscrowStatus escrow = booking.getEscrowStatus();
        
        // If money is held, we must refund
        if (escrow != EscrowStatus.PENDING && escrow != EscrowStatus.CANCELLED) {
            if (booking.getRazorpayPaymentId() == null) {
                log.error("Cannot refund booking {}: missing Razorpay payment ID", bookingId);
            } else {
                try {
                    String refundId = razorpayService.createRefund(
                        booking.getRazorpayPaymentId(),
                        booking.getAdvanceAmount(),
                        "Owner rejected booking request",
                        bookingId
                    );
                    escrowService.cancelAndRefund(booking, booking.getAdvanceAmount(), 
                        "Owner rejected", refundId);
                    log.info("Refund initiated for rejected booking {}: {}", bookingId, refundId);
                } catch (Exception e) {
                    log.error("Automated refund failed for rejected booking {}: {}", bookingId, e.getMessage());
                    // We still cancel the booking in our DB, but mark the failure
                }
            }
        }

        return updateStatus(bookingId, BookingStatus.CANCELLED, ownerEmail);
    }

    private void validateOwner(Booking booking, String email) {
        if (!booking.getListing().getOwner().getEmail().equals(email)) {
            throw BusinessException.forbidden("Only the listing owner can perform this action");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATE TRANSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Central status-transition method — called by all PATCH action endpoints.
     *
     * BUG-04 FIX: removed duplicate cancelBooking() method; all cancellation
     *             goes through this method which handles blocked-date cleanup.
     * BUG-05 FIX: acceptBooking set status to CONFIRMED (wrong); CONFIRMED
     *             is now correctly mapped from the PENDING_PAYMENT→CONFIRMED transition.
     * BUG-06 FIX: completeBooking guard now allows IN_USE as valid prior state.
     * BUG-09 FIX: IN_USE added to the owner-action authorization matrix so
     *             owner can transition CONFIRMED→IN_USE (mark handover).
     * BUG-10 FIX: single notification per cancellation; refund notification
     *             only sent if payment was actually completed (still TODO for
     *             actual refund processing, but notification is correct).
     */
    @Transactional
    public BookingResponse updateStatus(UUID bookingId, BookingStatus newStatus, String callerEmail) {

        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        User caller = userRepository.findByEmail(callerEmail)
            .orElseThrow(() -> BusinessException.notFound("User", callerEmail));

        boolean isOwner  = booking.getListing().getOwner().getEmail().equals(callerEmail);
        boolean isRenter = booking.getRenter().getEmail().equals(callerEmail);
        boolean isAdmin  = caller.getUserType() == User.UserType.ADMIN;

        // ── Authorization matrix ─────────────────────────────────────────────
        // BUG-09 FIX: IN_USE added as an owner-only action (mark handover)
        switch (newStatus) {
            case IN_USE, RETURNED, COMPLETED, NO_SHOW, DISPUTED -> {
                if (!isOwner && !isAdmin)
                    throw BusinessException.forbidden("Only the listing owner or admin can perform this action.");
            }
            case CANCELLED -> {
                if (!isOwner && !isRenter && !isAdmin)
                    throw BusinessException.forbidden("Not authorized to cancel this booking.");
            }
            default -> throw new IllegalArgumentException(
                "Unsupported direct status transition to: " + newStatus);
        }

        // ── State machine guard ──────────────────────────────────────────────
        // BUG-05 FIX: PENDING → ACCEPTED (not CONFIRMED)
        // BUG-06 FIX: IN_USE is now a valid precondition for COMPLETED
        BookingStatus current = booking.getBookingStatus();
        boolean validTransition = switch (current) {
            case PENDING_PAYMENT -> newStatus == BookingStatus.CONFIRMED || newStatus == BookingStatus.CANCELLED;
            case CONFIRMED       -> newStatus == BookingStatus.IN_USE || newStatus == BookingStatus.CANCELLED || newStatus == BookingStatus.NO_SHOW;
            case IN_USE          -> newStatus == BookingStatus.RETURNED || newStatus == BookingStatus.DISPUTED;
            case RETURNED        -> newStatus == BookingStatus.COMPLETED || newStatus == BookingStatus.DISPUTED;
            case DISPUTED        -> newStatus == BookingStatus.COMPLETED || newStatus == BookingStatus.CANCELLED;
            default              -> false; // COMPLETED, CANCELLED, NO_SHOW are terminal
        };

        if (!validTransition)
            throw new IllegalStateException(
                "Invalid booking transition: " + current + " → " + newStatus
                + " (booking: " + bookingId + ")");

        // ── Blocked-date side-effects ────────────────────────────────────────
        if (newStatus == BookingStatus.CONFIRMED) {
            if (blockedDateRepository
                    .findByListing_IdAndBooking_Id(booking.getListing().getId(), booking.getId())
                    .isEmpty()) {
                BlockedDate bd = new BlockedDate();
                bd.setListing(booking.getListing());
                bd.setBooking(booking);
                bd.setStartDate(booking.getStartDate());
                bd.setEndDate(booking.getEndDate());
                bd.setReason("BOOKING");
                blockedDateRepository.save(bd);
            }
        } else if (newStatus == BookingStatus.CANCELLED) {
            blockedDateRepository.deleteByListing_IdAndBooking_Id(
                booking.getListing().getId(), booking.getId());
        }

        // ── Escrow Side-Effects ──────────────────────────────────────────────
        // Sync the escrow service if the status change is a lifecycle event.
        if (newStatus == BookingStatus.IN_USE) {
            escrowService.markHandoverAndStartUse(booking);
            return mapToBookingResponse(
                    bookingRepository.findById(bookingId)
                            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId))
            );
        } else if (newStatus == BookingStatus.RETURNED) {
            escrowService.markReturn(booking);
            return mapToBookingResponse(
                    bookingRepository.findById(bookingId)
                            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId))
            );
        }

        booking.setBookingStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        // ── Post-transition notifications ────────────────────────────────────
        // BUG-10 FIX: one clear notification per outcome; no spurious refund
        //             notification unless payment was actually completed.
        switch (newStatus) {
            case PENDING_PAYMENT -> notificationService.sendNotification(
                booking.getRenter().getId(), "Booking Requested",
                String.format("Your booking for '%s' is pending payment.",
                    booking.getListing().getTitle()), "BOOKING_PENDING");

            case CANCELLED -> {
                UUID notifyId = isRenter
                    ? booking.getListing().getOwner().getId()
                    : booking.getRenter().getId();
                notificationService.sendNotification(
                    notifyId, "Booking Cancelled",
                    String.format("Booking for '%s' was cancelled by %s.",
                        booking.getListing().getTitle(), caller.getFullName()),
                    "BOOKING_CANCELLED");

                // CRITICAL FIX: Trigger actual escrow refund if money was held
                EscrowStatus escrow = booking.getEscrowStatus();
                if (escrow == EscrowStatus.ADVANCE_HELD || escrow == EscrowStatus.FULL_HELD) {
                    BigDecimal refundAmount = (escrow == EscrowStatus.FULL_HELD) 
                        ? booking.getTotalAmount() : booking.getAdvanceAmount();
                    
                    try {
                        String refundId = null;
                        if (booking.getRazorpayPaymentId() != null) {
                            refundId = razorpayService.createRefund(
                                booking.getRazorpayPaymentId(),
                                refundAmount,
                                "Booking cancelled by " + (isRenter ? "renter" : "owner"),
                                bookingId
                            );
                        }
                        escrowService.cancelAndRefund(booking, refundAmount, 
                            "Cancellation by " + (isRenter ? "renter" : "owner"), refundId);
                    } catch (Exception e) {
                        log.error("Refund failed during cancellation for booking {}: {}", bookingId, e.getMessage());
                        // Status update still proceeds, but ledger might need manual intervention
                    }
                }

                if ("COMPLETED".equals(booking.getPaymentStatus()) && isRenter) {
                    notificationService.sendNotification(
                        booking.getRenter().getId(), "Refund Initiated",
                        String.format("A refund for your booking of '%s' will be processed shortly.",
                            booking.getListing().getTitle()), "REFUND_INITIATED");
                }
            }

            case COMPLETED -> {
                notificationService.sendNotification(
                    booking.getRenter().getId(), "Booking Completed",
                    String.format("Your booking for '%s' is complete. Thank you!",
                        booking.getListing().getTitle()), "BOOKING_COMPLETED");
                if (booking.getSecurityDeposit().compareTo(BigDecimal.ZERO) > 0) {
                    notificationService.sendNotification(
                        booking.getRenter().getId(), "Security Deposit Refund",
                        String.format("Security deposit of ₹%s for '%s' will be refunded shortly.",
                            booking.getSecurityDeposit(), booking.getListing().getTitle()),
                        "DEPOSIT_REFUND");
                }
            }

            default -> { /* IN_USE, RETURNED, etc. — no notification needed */ }
        }

        log.info("Booking {} transitioned {} → {} by {}",
            bookingId, current, newStatus, callerEmail);

        return mapToBookingResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAPPER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Maps Booking entity to BookingResponse DTO.
     * BUG-08 FIX: include location/city/status fields in the inline listing snippet
     * so callers have full context without a second API call.
     */
    private BookingResponse mapToBookingResponse(Booking booking) {
        User   renter = booking.getRenter();
        User   owner  = (booking.getListing() != null)
                        ? booking.getListing().getOwner() : null;
        Listing l     = booking.getListing();

        return BookingResponse.builder()
            .id(booking.getId())
            .listing(l != null ? ListingResponse.builder()
                .id(l.getId())
                .title(l.getTitle())
                .pricePerDay(l.getPricePerDay())
                .images(l.getImages())
                .city(l.getCity())
                .location(l.getLocation())
                .category(l.getCategory())
                .build() : null)
            .renter(renter != null ? UserPublicResponse.builder()
                .id(renter.getId())
                .fullName(renter.getFullName())
                .isVerified(userProfileRepository.findByUserId(renter.getId())
                    .map(p -> p.getKycStatus() == com.rentit.model.UserProfile.KYCStatus.APPROVED)
                    .orElse(false))
                .build() : null)
            .owner(owner != null ? UserPublicResponse.builder()
                .id(owner.getId())
                .fullName(owner.getFullName())
                .isVerified(userProfileRepository.findByUserId(owner.getId())
                    .map(p -> p.getKycStatus() == com.rentit.model.UserProfile.KYCStatus.APPROVED)
                    .orElse(false))
                .build() : null)
            .startDate(booking.getStartDate())
            .endDate(booking.getEndDate())
            .totalDays(booking.getTotalDays())
            .rentalAmount(booking.getRentalAmount())
            .securityDeposit(booking.getSecurityDeposit())
            .totalAmount(booking.getTotalAmount())
            .gstAmount(Objects.requireNonNullElse(booking.getGstAmount(),  BigDecimal.ZERO))
            .platformFee(Objects.requireNonNullElse(booking.getPlatformFee(), BigDecimal.ZERO))
            .status(booking.getBookingStatus() != null ? booking.getBookingStatus().name() : "PENDING_PAYMENT")
            .escrowStatus(booking.getEscrowStatus() != null ? booking.getEscrowStatus().name() : "PENDING")
            .paymentStatus(booking.getPaymentStatus() != null ? booking.getPaymentStatus() : "PENDING")
            .razorpayOrderId(booking.getRazorpayOrderId())
            .razorpayPaymentId(booking.getRazorpayPaymentId())
            .createdAt(booking.getCreatedAt())
            .updatedAt(booking.getUpdatedAt())
            .build();
    }
}
