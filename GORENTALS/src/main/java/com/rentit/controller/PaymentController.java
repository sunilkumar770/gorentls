package com.rentit.controller;

import com.rentit.dto.InitiatePaymentResponse;
import com.rentit.dto.VerifyPaymentRequest;
import com.rentit.dto.payment.InitiatePaymentRequest;
import com.rentit.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('RENTER')")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Initiating payment for booking: {} by user: {}", request.getBookingId(), userDetails.getUsername());
        return ResponseEntity.ok(paymentService.initiatePayment(request.getBookingId(), userDetails.getUsername()));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('RENTER')")
    public ResponseEntity<Map<String, String>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Verifying payment for booking: {} by user: {}", request.getBookingId(), userDetails.getUsername());
        paymentService.verifyAndConfirmPayment(request, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("status", "success", "message", "Payment verified and booking confirmed"));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        try {
            log.debug("Received Razorpay webhook. Signature presence: {}", signature != null);
            
            // 1. Verify HMAC signature BEFORE any processing
            paymentService.verifyWebhookSignature(rawBody, signature);

            // 2. Parse the event type
            JSONObject event     = new JSONObject(rawBody);
            String     eventType = event.optString("event", "");

            if ("payment.captured".equals(eventType)) {
                JSONObject entity = event.getJSONObject("payload")
                                         .getJSONObject("payment")
                                         .getJSONObject("entity");

                String paymentId = entity.getString("id");
                String bookingId = "";
                
                if (!entity.isNull("notes")) {
                    bookingId = entity.getJSONObject("notes").optString("bookingId", "");
                }
                
                if (bookingId != null && !bookingId.isBlank()) {
                    log.info("Processing captured payment: {} for booking: {}", paymentId, bookingId);
                    paymentService.handlePaymentCaptured(bookingId, paymentId);
                }
            }
            return ResponseEntity.ok(Map.of("status", "ok"));

        } catch (SecurityException e) {
            log.error("[WEBHOOK-REJECTED] Invalid signature: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid signature"));
        } catch (Exception e) {
            log.error("[WEBHOOK-ERROR] Processing failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing failed"));
        }
    }
}
