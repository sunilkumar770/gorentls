package com.rentit.controller;

import com.rentit.dto.VerifyPaymentRequest;
import com.rentit.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(@RequestBody VerifyPaymentRequest request) {
        paymentService.verifyAndConfirmPayment(request);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Payment verified and booking confirmed"));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        try {
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
                    paymentService.handlePaymentCaptured(bookingId, paymentId);
                }
            }
            return ResponseEntity.ok(Map.of("status", "ok"));

        } catch (SecurityException e) {
            System.err.println("[WEBHOOK-REJECTED] " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid signature"));
        } catch (Exception e) {
            System.err.println("[WEBHOOK-ERROR] " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Processing failed"));
        }
    }
}
