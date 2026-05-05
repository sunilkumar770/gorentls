package com.rentit.webhook;

import com.rentit.model.Booking;
import com.rentit.model.Payment;
import com.rentit.model.Payout;
import com.rentit.model.enums.PaymentKind;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.PaymentRepository;
import com.rentit.repository.PayoutRepository;
import com.rentit.service.BookingEscrowService;
import com.rentit.service.RazorpayIntegrationService;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Handles all incoming Razorpay webhook events.
 */
@RestController
@RequestMapping("/api/webhooks")
public class RazorpayWebhookHandler {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookHandler.class);

    private final RazorpayIntegrationService razorpay;
    private final BookingEscrowService       escrowService;
    private final BookingRepository          bookingRepo;
    private final PaymentRepository          paymentRepo;
    private final PayoutRepository           payoutRepo;

    public RazorpayWebhookHandler(
        RazorpayIntegrationService razorpay,
        BookingEscrowService       escrowService,
        BookingRepository          bookingRepo,
        PaymentRepository          paymentRepo,
        PayoutRepository           payoutRepo
    ) {
        this.razorpay     = razorpay;
        this.escrowService = escrowService;
        this.bookingRepo   = bookingRepo;
        this.paymentRepo   = paymentRepo;
        this.payoutRepo    = payoutRepo;
    }

    @PostMapping(value = "/razorpay", consumes = "application/json")
    @Transactional
    public ResponseEntity<String> handle(
        @RequestBody  String rawBody,
        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        if (signature == null || signature.isBlank()) {
            log.warn("Webhook received with missing X-Razorpay-Signature header — rejecting");
            return ResponseEntity.badRequest().body("Missing signature");
        }

        try {
            razorpay.verifyWebhookSignature(rawBody, signature);
        } catch (IllegalArgumentException e) {
            log.warn("Webhook signature invalid — rejecting: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        JSONObject payload;
        String event;
        try {
            payload = new JSONObject(rawBody);
            event   = payload.getString("event");
        } catch (Exception e) {
            log.error("Failed to parse webhook body: {}", e.getMessage());
            return ResponseEntity.ok("Unparseable payload — acknowledged");
        }

        log.info("Razorpay webhook received: event={}", event);

        try {
            switch (event) {
                case "payment.captured"  -> handlePaymentCaptured(payload);
                case "payment.failed"    -> handlePaymentFailed(payload);
                case "refund.processed"  -> handleRefundProcessed(payload);
                case "payout.processed"  -> handlePayoutProcessed(payload);
                case "payout.failed"     -> handlePayoutFailed(payload);
                default                  -> log.info("Unhandled webhook event: {} — acknowledged", event);
            }
        } catch (Exception e) {
            log.error("Error processing webhook event={}: {}", event, e.getMessage(), e);
        }

        return ResponseEntity.ok("OK");
    }

    private void handlePaymentCaptured(JSONObject payload) {
        JSONObject paymentObj = payload
            .getJSONObject("payload")
            .getJSONObject("payment")
            .getJSONObject("entity");

        String rpPaymentId = paymentObj.getString("id");
        String rpOrderId   = paymentObj.getString("order_id");
        long   paise       = paymentObj.getLong("amount");
        BigDecimal amountINR = RazorpayIntegrationService.fromPaise(paise);

        JSONObject notes = paymentObj.optJSONObject("notes");
        if (notes == null) {
            log.warn("payment.captured: no notes on payment {} — cannot identify booking", rpPaymentId);
            return;
        }

        String bookingIdStr  = notes.optString("booking_id",   null);
        String paymentKindStr = notes.optString("payment_kind", "ADVANCE");

        if (bookingIdStr == null) {
            log.warn("payment.captured: missing booking_id in notes for payment {}", rpPaymentId);
            return;
        }

        if (paymentRepo.existsByRazorpayPaymentId(rpPaymentId)) {
            log.info("payment.captured: payment {} already processed — skipping", rpPaymentId);
            return;
        }

        UUID bookingId = UUID.fromString(bookingIdStr);
        Optional<Booking> bookingOpt = bookingRepo.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            log.error("payment.captured: booking {} not found for payment {}", bookingId, rpPaymentId);
            return;
        }

        Booking booking = bookingOpt.get();

        PaymentKind kind;
        try {
            kind = PaymentKind.valueOf(paymentKindStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            kind = PaymentKind.ADVANCE;
            log.warn("payment.captured: unrecognized payment kind '{}', defaulting to ADVANCE", paymentKindStr);
        }

        Payment payment = new Payment();
        payment.setRazorpayOrderId(rpOrderId);
        payment.setRazorpayPaymentId(rpPaymentId);
        payment.setAmount(amountINR);
        payment.setKind(kind);
        payment.setStatus("CAPTURED");
        payment.setBooking(booking); 
        paymentRepo.save(payment);

        // SYNC: Link the latest captured payment ID to the booking for receipt generation
        booking.setRazorpayPaymentId(rpPaymentId);
        booking.setPaymentStatus("CAPTURED");
        
        escrowService.applyPayment(booking, payment);

        log.info("payment.captured: applied ₹{} kind={} to booking={} (paymentId={})", 
            amountINR, kind, bookingId, rpPaymentId);
    }

    private void handlePaymentFailed(JSONObject payload) {
        JSONObject paymentObj = payload
            .getJSONObject("payload")
            .getJSONObject("payment")
            .getJSONObject("entity");

        String rpPaymentId = paymentObj.getString("id");
        String errorCode   = paymentObj.optJSONObject("error_code") != null
            ? paymentObj.getJSONObject("error_code").optString("code", "UNKNOWN")
            : "UNKNOWN";

        JSONObject notes      = paymentObj.optJSONObject("notes");
        String bookingIdStr   = notes != null ? notes.optString("booking_id", null) : null;

        log.warn("payment.failed: paymentId={} bookingId={} errorCode={}",
            rpPaymentId, bookingIdStr, errorCode);

        paymentRepo.findByRazorpayPaymentId(rpPaymentId).ifPresent(p -> {
            p.setStatus("FAILED");
            paymentRepo.save(p);
        });
    }

    private void handleRefundProcessed(JSONObject payload) {
        JSONObject refundObj = payload
            .getJSONObject("payload")
            .getJSONObject("refund")
            .getJSONObject("entity");

        String rpRefundId  = refundObj.getString("id");
        String rpPaymentId = refundObj.getString("payment_id");
        long   paise       = refundObj.getLong("amount");
        BigDecimal amountINR = RazorpayIntegrationService.fromPaise(paise);

        log.info("refund.processed: refundId={} paymentId={} amount=₹{}",
            rpRefundId, rpPaymentId, amountINR);

        paymentRepo.findByRazorpayPaymentId(rpPaymentId).ifPresent(p -> {
            p.setRefundId(rpRefundId);
            p.setRefundStatus("PROCESSED");
            p.setStatus("REFUNDED");
            paymentRepo.save(p);
            log.info("refund.processed: payment {} marked as REFUNDED with refundId={}", rpPaymentId, rpRefundId);
        });
    }

    private void handlePayoutProcessed(JSONObject payload) {
        JSONObject payoutObj = payload
            .getJSONObject("payload")
            .getJSONObject("payout")
            .getJSONObject("entity");

        String rpPayoutId = payoutObj.getString("id");

        Optional<Payout> payoutOpt = payoutRepo.findByRpPayoutId(rpPayoutId);
        if (payoutOpt.isEmpty()) {
            log.warn("payout.processed: no platform payout found for rpPayoutId={}", rpPayoutId);
            return;
        }

        Payout payout = payoutOpt.get();

        if (payout.getStatus() == com.rentit.model.enums.PayoutStatus.SUCCESS) {
            log.info("payout.processed: payoutId={} already SUCCESS — skipping", payout.getId());
            return;
        }

        payout.markSuccess();
        payoutRepo.save(payout);

        bookingRepo.findById(payout.getBookingId()).ifPresent(booking -> {
            booking.setEscrowStatus(com.rentit.model.enums.EscrowStatus.PAID_OUT);
            bookingRepo.save(booking);
        });

        log.info("payout.processed: payoutId={} rpPayoutId={} bookingId={} — PAID_OUT",
            payout.getId(), rpPayoutId, payout.getBookingId());
    }

    private void handlePayoutFailed(JSONObject payload) {
        JSONObject payoutObj = payload
            .getJSONObject("payload")
            .getJSONObject("payout")
            .getJSONObject("entity");

        String rpPayoutId  = payoutObj.getString("id");
        String errorReason = payoutObj.optString("status_details", "Unknown failure reason");

        Optional<Payout> payoutOpt = payoutRepo.findByRpPayoutId(rpPayoutId);
        if (payoutOpt.isEmpty()) {
            log.warn("payout.failed: no platform payout found for rpPayoutId={}", rpPayoutId);
            return;
        }

        Payout payout = payoutOpt.get();
        payout.markFailed(errorReason);
        payoutRepo.save(payout);

        log.error("payout.failed: payoutId={} rpPayoutId={} bookingId={} reason={}",
            payout.getId(), rpPayoutId, payout.getBookingId(), errorReason);
    }
}
