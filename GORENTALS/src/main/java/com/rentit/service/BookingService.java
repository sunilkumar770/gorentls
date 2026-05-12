package com.rentit.service;

import com.rentit.dto.BookingRequest;
import com.rentit.dto.UserPublicResponse;
import com.rentit.dto.BookingResponse;
import com.rentit.exception.BusinessException;
import com.rentit.model.*;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.pricing.PricingCalculator;
import com.rentit.repository.*;
import com.rentit.util.DtoMapper;
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
    private final ListingRepository     listingRepository;
    private final UserRepository        userRepository;
    private final BlockedDateRepository blockedDateRepository;
    private final NotificationService   notificationService;
    private final BookingEscrowService  escrowService;
    private final RazorpayIntegrationService razorpayService;
    private final ReceiptService        receiptService;
    private final BookingLifecycleManager lifecycleManager;
    private final RefundOutboxRepository refundOutboxRepository;
    private final PaymentOutboxRepository paymentOutboxRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create a new booking request.
     * HARDENING: Uses Isolation.SERIALIZABLE and PESSIMISTIC_WRITE lock on the listing
     * to prevent TOCTOU race conditions (double-booking).
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.SERIALIZABLE)
    public BookingResponse createBooking(BookingRequest request, String userEmail) {
        // 1. Idempotency Check
        if (request.getIdempotencyKey() != null) {
            bookingRepository.findByIdempotencyKey(request.getIdempotencyKey())
                .ifPresent(existing -> {
                    log.info("Duplicate booking request detected for key: {}", request.getIdempotencyKey());
                    throw BusinessException.conflict("Duplicate booking request");
                });
        }

        User renter = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("Renter", userEmail));

        // 2. Fetch with Pessimistic Lock
        Listing listing = listingRepository.findByIdWithLock(request.getListingId())
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

        if (startDate.isBefore(today.minusDays(1))) {
            throw BusinessException.badRequest("Start date cannot be in the past");
        }
        if (!endDate.isAfter(startDate)) {
            throw BusinessException.badRequest("End date must be after start date");
        }

        // 3. Re-validate Availability inside Locked Transaction
        boolean hasOverlap = bookingRepository.existsConflictingBooking(
            listing.getId(), startDate, endDate, 
            List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_USE, BookingStatus.PENDING_PAYMENT)
        );
        boolean isBlocked = blockedDateRepository.isDateRangeBlocked(
            listing.getId(), startDate, endDate);

        if (hasOverlap || isBlocked) {
            throw BusinessException.conflict("This item is already booked for the selected dates");
        }

        // ── Pricing ──────────────────────────────────────────────────────────
        long totalDays = Math.max(1, ChronoUnit.DAYS.between(startDate, endDate));

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
        booking.setBookingStatus(BookingStatus.PENDING);
        booking.setEscrowStatus(com.rentit.model.enums.EscrowStatus.PENDING);
        booking.setPaymentStatus("PENDING");
        booking.setIdempotencyKey(request.getIdempotencyKey());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: {} for listing {} by renter {} (idempotencyKey: {})",
            saved.getId(), listing.getId(), renter.getEmail(), request.getIdempotencyKey());

        notificationService.sendNotification(
            listing.getOwner().getId(),
            "New Booking Request",
            String.format("You have a new booking request for '%s' from %s.",
                listing.getTitle(), renter.getFullName()),
            "BOOKING_REQUEST"
        );

        return DtoMapper.mapToBookingResponse(saved);
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

        return DtoMapper.mapToBookingResponse(booking);
    }

    /** Get paginated bookings for a renter. BUG-07 FIX: 404 not RuntimeException. */
    @Transactional(readOnly = true)
    public Page<BookingResponse> getBookingsByUser(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        return bookingRepository.findByRenterId(user.getId(), pageable)
                                .map(DtoMapper::mapToBookingResponse);
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
                                .map(DtoMapper::mapToBookingResponse);
    }

    /** Get upcoming CONFIRMED/IN_USE bookings for a renter. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUpcomingBookingsForRenter(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        return bookingRepository.findUpcomingBookingsByRenter(user.getId(), LocalDate.now())
            .stream().map(DtoMapper::mapToBookingResponse).collect(Collectors.toList());
    }

    /** Get upcoming CONFIRMED/IN_USE bookings for an owner. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getUpcomingBookingsForOwner(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> BusinessException.notFound("Owner", ownerEmail));
        return bookingRepository.findUpcomingBookingsByOwner(owner.getId(), LocalDate.now())
            .stream().map(DtoMapper::mapToBookingResponse).collect(Collectors.toList());
    }

    /** Check availability without creating a booking. */
    @Transactional(readOnly = true)
    public boolean isListingAvailable(UUID listingId, LocalDate startDate, LocalDate endDate) {
        return !bookingRepository.isListingBooked(listingId, startDate, endDate);
    }

    @Transactional
    public BookingResponse confirmBooking(UUID bookingId, String ownerEmail) {
        Booking booking = bookingRepository.findByIdWithLock(bookingId)
                .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        validateOwner(booking, ownerEmail);

        BookingStatus current = booking.getBookingStatus();
        EscrowStatus escrow = booking.getEscrowStatus();

        if (current == BookingStatus.PENDING_PAYMENT || current == BookingStatus.PENDING) {
            // 1. Update Booking Status
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);

            // 2. Create Payment Outbox Event for Capture
            if (booking.getRazorpayPaymentId() != null) {
                PaymentOutboxEvent event = PaymentOutboxEvent.builder()
                        .bookingId(booking.getId())
                        .type(com.rentit.model.enums.PaymentEventType.CAPTURE)
                        .razorpayPaymentId(booking.getRazorpayPaymentId())
                        .amount(booking.getTotalAmount())
                        .status(com.rentit.model.enums.OutboxStatus.PENDING)
                        .build();
                paymentOutboxRepository.save(event);
                log.info("Payment capture event queued for booking {}", booking.getId());
            }

            // 3. Mark escrow (this might need to be adjusted if escrow logic also calls external APIs)
            escrowService.confirmOwnerAcceptance(booking);
            
            return DtoMapper.mapToBookingResponse(booking);
        } else if (current == BookingStatus.CONFIRMED
                && (escrow == EscrowStatus.ADVANCE_HELD || escrow == EscrowStatus.FULL_HELD)) {
            escrowService.markHandoverAndStartUse(booking);
            return DtoMapper.mapToBookingResponse(booking);
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
                throw BusinessException.badRequest("Cannot reject booking: Missing payment ID for refund.");
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
                    
                    // RECORD TO OUTBOX
                    RefundOutbox outbox = RefundOutbox.builder()
                        .bookingId(bookingId)
                        .paymentId(booking.getRazorpayPaymentId())
                        .amount(booking.getAdvanceAmount())
                        .reason("Owner rejected booking request")
                        .status("PENDING")
                        .nextRetryAt(LocalDateTime.now().plusMinutes(1))
                        .lastError(e.getMessage())
                        .build();
                    refundOutboxRepository.save(outbox);
                    
                    log.warn("Automated refund failed but rejection committed. Refund recorded in outbox for retry for booking {}.", bookingId);
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

        Booking booking = bookingRepository.findByIdWithLock(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        User caller = userRepository.findByEmail(callerEmail)
            .orElseThrow(() -> BusinessException.notFound("User", callerEmail));

        boolean isOwner  = booking.getListing().getOwner().getEmail().equals(callerEmail);
        boolean isRenter = booking.getRenter().getEmail().equals(callerEmail);
        boolean isAdmin  = caller.getUserType() == User.UserType.ADMIN;

        validateStatusTransitionAuthorization(newStatus, isOwner, isRenter, isAdmin);

        BookingStatus current = booking.getBookingStatus();
        if (!isValidTransition(current, newStatus)) {
            throw new IllegalStateException(
                "Invalid booking transition: " + current + " → " + newStatus
                + " (booking: " + bookingId + ")");
        }

        handleBlockedDateSideEffects(booking, newStatus);

        // ── Escrow Side-Effects ──────────────────────────────────────────────
        if (newStatus == BookingStatus.IN_USE) {
            escrowService.markHandoverAndStartUse(booking);
            return DtoMapper.mapToBookingResponse(booking);
        } else if (newStatus == BookingStatus.RETURNED) {
            escrowService.markReturn(booking);
            return DtoMapper.mapToBookingResponse(booking);
        }

        booking.setBookingStatus(newStatus);
        booking.setUpdatedAt(LocalDateTime.now());
        
        if (newStatus == BookingStatus.CANCELLED) {
            processCancellationEscrowRefund(booking, isRenter);
        }

        Booking saved = bookingRepository.save(booking);

        sendPostTransitionNotifications(saved, newStatus, caller, isRenter);

        log.info("Booking {} transitioned {} → {} by {}",
            bookingId, current, newStatus, callerEmail);

        return DtoMapper.mapToBookingResponse(saved);
    }

    private void validateStatusTransitionAuthorization(BookingStatus newStatus, boolean isOwner, boolean isRenter, boolean isAdmin) {
        switch (newStatus) {
            case CONFIRMED, IN_USE, RETURNED, COMPLETED, NO_SHOW, DISPUTED -> {
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
    }

    private boolean isValidTransition(BookingStatus current, BookingStatus newStatus) {
        return current.canTransitionTo(newStatus);
    }

    @Transactional
    public void transitionStatus(Booking booking, BookingStatus newStatus, String description) {
        lifecycleManager.transition(booking, newStatus, description);
        handleBlockedDateSideEffects(booking, newStatus);
    }

    private void handleBlockedDateSideEffects(Booking booking, BookingStatus newStatus) {
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
    }

    private void processCancellationEscrowRefund(Booking booking, boolean isRenter) {
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
                        booking.getId()
                    );
                }
                escrowService.cancelAndRefund(booking, refundAmount, 
                    "Cancellation by " + (isRenter ? "renter" : "owner"), refundId);
            } catch (Exception e) {
                log.error("Refund failed during cancellation for booking {}: {}", booking.getId(), e.getMessage());
                
                RefundOutbox outbox = RefundOutbox.builder()
                    .bookingId(booking.getId())
                    .paymentId(booking.getRazorpayPaymentId())
                    .amount(refundAmount)
                    .reason("Booking cancelled by " + (isRenter ? "renter" : "owner"))
                    .status("PENDING")
                    .nextRetryAt(LocalDateTime.now().plusMinutes(1))
                    .lastError(e.getMessage())
                    .build();
                refundOutboxRepository.save(outbox);
                
                log.warn("Automated refund failed but cancellation committed. Refund recorded in outbox for retry for booking {}.", booking.getId());
            }
        }
    }

    private void sendPostTransitionNotifications(Booking booking, BookingStatus newStatus, User caller, boolean isRenter) {
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
    }

    public List<java.util.Map<String, Object>> getOwnerWeeklyStats(String ownerEmail, int weeks) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> BusinessException.notFound("User", ownerEmail));
        
        UUID ownerId = owner.getId();
        LocalDate today = LocalDate.now();
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (int i = weeks - 1; i >= 0; i--) {
            LocalDate weekStart = today.minusWeeks(i).with(java.time.DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(6);
            List<Booking> weekBookings = bookingRepository
                .findByOwnerIdAndStatusAndStartDateBetween(
                    ownerId, BookingStatus.COMPLETED,
                    weekStart, weekEnd);
            double earnings = weekBookings.stream()
                .mapToDouble(b -> b.getRentalAmount().doubleValue()).sum();
            java.util.Map<String, Object> stat = new java.util.LinkedHashMap<>();
            stat.put("week", "Wk " + weekStart.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR));
            stat.put("earnings", earnings);
            stat.put("bookings", weekBookings.size());
            result.add(stat);
        }
        return result;
    }

}
