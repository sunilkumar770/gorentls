package com.rentit.controller;

import com.rentit.dto.payment.*;
import com.rentit.exception.BusinessException;
import com.rentit.model.Booking;
import com.rentit.model.Payment;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.model.enums.PaymentKind;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.PaymentRepository;
import com.rentit.service.BookingEscrowService;
import com.rentit.service.RazorpayIntegrationService;
import jakarta.validation.Valid;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Payment and escrow management endpoints.
 *
 * BASE URL: /api/payments
 *
 * Endpoint summary:
 *   POST   /api/payments/order              Create Razorpay order (advance or final)
 *   POST   /api/payments/confirm            Verify signature + apply captured payment
 *   GET    /api/payments/escrow/{bookingId} Escrow summary for a booking
 *   POST   /api/payments/refund             Admin: issue refund (non-dispute)
 *
 * Security model:
 *   - RENTER: createOrder, confirmPayment, getEscrowSummary (own bookings only)
 *   - OWNER:  getEscrowSummary (own listings' bookings only)
 *   - ADMIN:  refund + all of the above
 *
 * Notes:
 *   - Signature verification happens HERE before any service call. If the
 *     signature is invalid, we return 400 immediately without touching escrow.
 *   - All domain state changes are in BookingEscrowService — controller is thin.
 *   - PrincipalId is resolved from the JWT subject claim (UUID string).
 */
@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments & Escrow", description = "Razorpay PG + escrow lifecycle")
public class BookingPaymentController {

    private static final Logger log = LoggerFactory.getLogger(BookingPaymentController.class);

    private final RazorpayIntegrationService razorpay;
    private final BookingEscrowService       escrowService;
    private final BookingRepository          bookingRepo;
    private final PaymentRepository          paymentRepo;

    public BookingPaymentController(
        RazorpayIntegrationService razorpay,
        BookingEscrowService       escrowService,
        BookingRepository          bookingRepo,
        PaymentRepository          paymentRepo
    ) {
        this.razorpay      = razorpay;
        this.escrowService = escrowService;
        this.bookingRepo   = bookingRepo;
        this.paymentRepo   = paymentRepo;
    }

    // ── POST /api/payments/order ──────────────────────────────────────────────

    /**
     * Create a Razorpay order for the next due payment on a booking.
     *
     * The response JSON is passed DIRECTLY to the Razorpay Checkout JS SDK
     * on the frontend — no transformation needed.
     *
     * Payment kind resolution:
     *   - ADVANCE           → booking.advanceAmount
     *   - FINAL             → booking.remainingAmount
     *   - SECURITY_DEPOSIT  → booking.securityDeposit (if applicable)
     *
     * @param principal  authenticated user (resolved from JWT)
     */
    @Operation(
        summary     = "Create a Razorpay payment order",
        description = "Creates a Razorpay order for ADVANCE, FINAL, or SECURITY_DEPOSIT " +
                      "payment. Pass the response JSON directly to the Razorpay Checkout JS SDK."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid paymentKind or zero amount",
            content = @Content(schema = @Schema(ref = "#/components/schemas/ProblemDetail"))),
        @ApiResponse(responseCode = "404", description = "Booking not found"),
        @ApiResponse(responseCode = "403", description = "Booking does not belong to this renter")
    })
    @PostMapping("/order")
    @PreAuthorize("hasAnyRole('RENTER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> createOrder(
        @Valid @RequestBody CreateOrderRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID userId    = UUID.fromString(principal.getUsername());
        Booking booking = fetchBookingForUser(req.bookingId(), userId, "RENTER");

        String kind = req.paymentKind() != null
            ? req.paymentKind().toUpperCase()
            : "ADVANCE";

        BigDecimal amount = switch (kind) {
            case "ADVANCE"          -> booking.getAdvanceAmount();
            case "FINAL"            -> booking.getRemainingAmount();
            case "SECURITY_DEPOSIT" -> booking.getSecurityDeposit() != null
                                        ? booking.getSecurityDeposit()
                                        : BigDecimal.ZERO;
            default -> throw new BusinessException(
                "Invalid paymentKind: " + kind,
                "INVALID_PAYMENT_KIND"
            );
        };

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                "Payment amount for kind '" + kind + "' is zero or unavailable",
                "ZERO_PAYMENT_AMOUNT"
            );
        }

        JSONObject order = razorpay.createOrder(
            amount,
            booking.getId(),
            kind,
            "INR"
        );

        log.info("Order created: bookingId={} kind={} amount=₹{} userId={}",
            booking.getId(), kind, amount, userId);

        // Convert JSONObject to Map for clean Jackson serialization
        Map<String, Object> response = jsonToMap(order);
        return ResponseEntity.ok(response);
    }

    // ── POST /api/payments/confirm ────────────────────────────────────────────

    /**
     * Verify the Razorpay payment signature and apply the captured payment.
     *
     * This is the callback endpoint called by the frontend after the Razorpay
     * Checkout JS SDK fires the payment.success event.
     *
     * Flow:
     *   1. Verify HMAC-SHA256 signature (invalid → 400, no DB write)
     *   2. Idempotency check (duplicate → 200 with existing status)
     *   3. Create Payment record
     *   4. Delegate to BookingEscrowService.applyPayment()
     *
     * @return updated booking escrow status
     */
    @Operation(
        summary     = "Confirm a captured payment",
        description = "Verifies the Razorpay HMAC-SHA256 signature and applies the payment " +
                      "to the escrow state machine. MUST be called from your backend after " +
                      "the Razorpay Checkout JS fires payment.success — never from the frontend directly."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Payment applied to escrow"),
        @ApiResponse(responseCode = "400", description = "Invalid signature — do not retry"),
        @ApiResponse(responseCode = "409", description = "Payment already applied (idempotent 200)")
    })
    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('RENTER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> confirmPayment(
        @Valid @RequestBody ConfirmPaymentRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID userId    = UUID.fromString(principal.getUsername());
        Booking booking = fetchBookingForUser(req.bookingId(), userId, "RENTER");

        // ── Signature verification (must happen before any DB write) ───────────
        boolean valid = razorpay.verifyPaymentSignature(
            req.razorpayOrderId(),
            req.razorpayPaymentId(),
            req.razorpaySignature()
        );

        if (!valid) {
            log.warn("Invalid payment signature: bookingId={} userId={}",
                req.bookingId(), userId);
            throw new BusinessException(
                "Payment signature verification failed. Do not retry — contact support.",
                "INVALID_PAYMENT_SIGNATURE",
                org.springframework.http.HttpStatus.BAD_REQUEST
            );
        }

        // ── Idempotency check ──────────────────────────────────────────────────
        if (paymentRepo.existsByRazorpayPaymentId(req.razorpayPaymentId())) {
            log.info("Duplicate confirmPayment call — paymentId={} already processed",
                req.razorpayPaymentId());
            return ResponseEntity.ok(Map.of(
                "status",    "ALREADY_APPLIED",
                "bookingId", booking.getId(),
                "escrowStatus", booking.getEscrowStatus()
            ));
        }

        // ── Create and persist Payment record ──────────────────────────────────
        PaymentKind kind;
        try {
            kind = PaymentKind.valueOf(req.paymentKind().toUpperCase());
        } catch (IllegalArgumentException e) {
            kind = PaymentKind.ADVANCE;
        }

        Payment payment = new Payment();
        payment.setRazorpayOrderId(req.razorpayOrderId());
        payment.setRazorpayPaymentId(req.razorpayPaymentId());
        payment.setKind(kind);
        payment.setStatus("CAPTURED");
        payment.setBooking(booking);

        // Resolve amount from booking (source of truth — never trust client-sent amount)
        payment.setAmount(kind == PaymentKind.ADVANCE
            ? booking.getAdvanceAmount()
            : booking.getRemainingAmount());

        paymentRepo.save(payment);

        // ── Apply to escrow state machine ──────────────────────────────────────
        escrowService.applyPayment(booking, payment);

        log.info("Payment confirmed: bookingId={} kind={} userId={}",
            booking.getId(), kind, userId);

        return ResponseEntity.ok(Map.of(
            "status",       "APPLIED",
            "bookingId",    booking.getId(),
            "paymentKind",  kind,
            "escrowStatus", booking.getEscrowStatus()
        ));
    }

    // ── GET /api/payments/escrow/{bookingId} ──────────────────────────────────

    /**
     * Get the full escrow summary for a booking.
     *
     * Access rules:
     *   - RENTER: only their own bookings
     *   - OWNER:  only bookings on their listings
     *   - ADMIN:  any booking
     */
    @Operation(
        summary     = "Get escrow summary for a booking",
        description = "Returns current escrow status, amounts, and dispute window expiry. " +
                      "Accessible to the renter, the listing owner, and admins."
    )
    @ApiResponse(responseCode = "200", description = "Escrow summary")
    @ApiResponse(responseCode = "403", description = "User is not the renter or owner")
    @GetMapping("/escrow/{bookingId}")
    @PreAuthorize("hasAnyRole('RENTER', 'OWNER', 'ADMIN')")
    public ResponseEntity<EscrowSummaryResponse> getEscrowSummary(
        @PathVariable UUID bookingId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID userId    = UUID.fromString(principal.getUsername());
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        // Authorization: user must be renter, owner, or admin
        enforceEscrowAccess(booking, userId);

        BigDecimal totalCollected = BigDecimal.ZERO;
        if (booking.getAdvanceAmount() != null)
            totalCollected = totalCollected.add(booking.getAdvanceAmount());
        if (booking.getRemainingAmount() != null)
            totalCollected = totalCollected.add(booking.getRemainingAmount());

        boolean windowOpen = booking.getDisputeWindowEndsAt() != null
            && Instant.now().isBefore(booking.getDisputeWindowEndsAt());

        EscrowSummaryResponse summary = new EscrowSummaryResponse(
            booking.getId(),
            booking.getEscrowStatus(),
            booking.getAdvanceAmount(),
            booking.getRemainingAmount(),
            booking.getSecurityDeposit(),
            booking.getPlatformFee(),
            booking.getGstAmount(),
            totalCollected,
            booking.getDisputeWindowEndsAt(),
            windowOpen
        );

        return ResponseEntity.ok(summary);
    }

    // ── POST /api/payments/refund ─────────────────────────────────────────────

    /**
     * Admin-initiated refund (outside of dispute flow).
     * Use for: confirmed cancellations, direct renter requests, system errors.
     *
     * For dispute-driven refunds, use DisputeController.resolveDispute().
     */
    @Operation(
        summary     = "Admin: issue a direct refund",
        description = "Admin-only. Issues a Razorpay refund outside the dispute flow. " +
                      "For dispute-driven refunds, use POST /api/disputes/{id}/resolve."
    )
    @ApiResponse(responseCode = "200", description = "Refund initiated")
    @ApiResponse(responseCode = "409", description = "Escrow already paid out or refunded")
    @PostMapping("/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> issueRefund(
        @Valid @RequestBody RefundRequest req
    ) {
        Booking booking = bookingRepo.findById(req.bookingId())
            .orElseThrow(() -> BusinessException.notFound("Booking", req.bookingId()));

        // Guard: don't refund already-paid-out or refunded bookings
        if (booking.getEscrowStatus() == EscrowStatus.PAID_OUT) {
            throw BusinessException.conflict(
                "Cannot refund a booking that has already been paid out to the owner",
                "ESCROW_ALREADY_PAID_OUT"
            );
        }
        if (booking.getEscrowStatus() == EscrowStatus.REFUNDED) {
            throw BusinessException.conflict(
                "Booking has already been refunded",
                "ESCROW_ALREADY_REFUNDED"
            );
        }

        String refundId = razorpay.createRefund(
            req.razorpayPaymentId(),
            req.amount(),
            req.reason(),
            req.bookingId()
        );

        escrowService.processFullRefund(booking, req.amount(), req.reason(), refundId);

        log.info("Admin refund issued: bookingId={} amount=₹{} refundId={}",
            req.bookingId(), req.amount(), refundId);

        return ResponseEntity.ok(Map.of(
            "status",       "REFUND_INITIATED",
            "bookingId",    req.bookingId(),
            "razorpayRefundId", refundId,
            "amount",       req.amount()
        ));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Fetch booking and verify the requesting user has the right access.
     *
     * @param role  "RENTER" → must match booking's renter
     */
    private Booking fetchBookingForUser(UUID bookingId, UUID userId, String role) {
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        if ("RENTER".equals(role)) {
            UUID renterId = booking.getRenter() != null ? booking.getRenter().getId() : null;
            if (renterId == null || !renterId.equals(userId)) {
                throw BusinessException.forbidden(
                    "You do not have access to booking: " + bookingId
                );
            }
        }
        return booking;
    }

    private void enforceEscrowAccess(Booking booking, UUID userId) {
        UUID renterId = booking.getRenter() != null
            ? booking.getRenter().getId() : null;
        UUID ownerId  = booking.getListing() != null
            && booking.getListing().getOwner() != null
            ? booking.getListing().getOwner().getId() : null;

        if (!userId.equals(renterId) && !userId.equals(ownerId)) {
            throw BusinessException.forbidden(
                "You do not have access to escrow details for booking: " + booking.getId()
            );
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToMap(JSONObject json) {
        return new com.fasterxml.jackson.databind.ObjectMapper()
            .convertValue(
                new org.json.JSONObject(json.toString()).toMap(),
                Map.class
            );
    }
}
