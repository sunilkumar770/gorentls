package com.rentit.service;

import com.razorpay.*;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import com.rentit.exception.BusinessException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Single integration point for ALL Razorpay API calls.
 *
 * Covers two separate Razorpay products:
 *   1. Razorpay PG  — order creation, payment verification, refunds (renter → platform)
 *   2. RazorpayX    — contacts, fund accounts, payouts (platform → owner)
 *
 * RULES:
 *   - No business logic here. This class only translates domain objects to/from
 *     Razorpay API requests/responses.
 *   - All exceptions from the Razorpay SDK are caught, logged, and re-thrown
 *     as RuntimeException so the calling service can decide how to handle them.
 *   - Amount conversion: always pass INR BigDecimal in; this class converts to paise
 *     (×100) for API calls and converts paise back to INR on read.
 */
@Service
public class RazorpayIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayIntegrationService.class);
    private static final String HMAC_ALGO = "HmacSHA256";

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    @Value("${razorpay.account-number}")
    private String razorpayXAccountNumber;

    // ── PG: Order creation ────────────────────────────────────────────────────

    @CircuitBreaker(name = "razorpay", fallbackMethod = "createOrderFallback")
    @Retry(name = "razorpay")
    public JSONObject createOrder(
        BigDecimal amountINR,
        UUID bookingId,
        String paymentKind,
        String currency
    ) {
        // ── DEMO/MOCK MODE ───────────────────────────────────────────────────
        if ("rzp_test_demo".equals(keyId)) {
            log.info("Razorpay order created (MOCK): orderId=order_mock_{} bookingId={} kind={} amount=₹{}",
                UUID.randomUUID().toString().substring(0, 8), bookingId, paymentKind, amountINR);
            
            JSONObject mockOrder = new JSONObject();
            mockOrder.put("id", "order_mock_" + UUID.randomUUID().toString().substring(0, 8));
            mockOrder.put("entity", "order");
            mockOrder.put("amount", toPaise(amountINR));
            mockOrder.put("currency", currency != null ? currency : "INR");
            mockOrder.put("receipt", bookingId.toString());
            mockOrder.put("status", "created");
            return mockOrder;
        }

        try {
            RazorpayClient client = client();
            long paise = toPaise(amountINR);

            JSONObject options = new JSONObject();
            options.put("amount",          paise);
            options.put("currency",        currency != null ? currency : "INR");
            options.put("receipt",         bookingId.toString());
            options.put("payment_capture", 1);  // auto-capture

            JSONObject notes = new JSONObject();
            notes.put("booking_id",   bookingId.toString());
            notes.put("payment_kind", paymentKind);
            options.put("notes", notes);

            Order order = client.orders.create(options);
            log.info("Razorpay order created: orderId={} bookingId={} kind={} amount=₹{}",
                order.get("id"), bookingId, paymentKind, amountINR);

            return order.toJson();

        } catch (RazorpayException e) {
            log.error("Razorpay createOrder failed: bookingId={} kind={} error={}",
                bookingId, paymentKind, e.getMessage());
            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage(), e);
        }
    }

    // ── PG: Signature verification ────────────────────────────────────────────

    @CircuitBreaker(name = "razorpay")
    @Retry(name = "razorpay")
    public boolean verifyPaymentSignature(
        String orderId,
        String paymentId,
        String signature
    ) {
        // ── DEMO/MOCK MODE ───────────────────────────────────────────────────
        if (orderId != null && orderId.startsWith("order_mock_")) {
            log.info("Payment signature verification (MOCK BYPASS): orderId={} paymentId={}", orderId, paymentId);
            return true;
        }

        try {
            JSONObject params = new JSONObject();
            params.put("razorpay_order_id",   orderId);
            params.put("razorpay_payment_id",  paymentId);
            params.put("razorpay_signature",   signature);

            boolean valid = Utils.verifyPaymentSignature(params, keySecret);
            log.info("Payment signature verification: orderId={} paymentId={} valid={}",
                orderId, paymentId, valid);
            return valid;

        } catch (RazorpayException e) {
            log.warn("Payment signature verification threw exception: orderId={} error={}",
                orderId, e.getMessage());
            return false;
        }
    }

    // ── PG: Refunds ───────────────────────────────────────────────────────────

    @CircuitBreaker(name = "razorpay")
    @Retry(name = "razorpay")
    public String createRefund(
        String razorpayPaymentId,
        BigDecimal amountINR,
        String reason,
        UUID bookingId
    ) {
        try {
            RazorpayClient client = client();

            JSONObject options = new JSONObject();
            if (amountINR != null) {
                options.put("amount", toPaise(amountINR));
            }
            options.put("speed", "optimum");

            JSONObject notes = new JSONObject();
            notes.put("booking_id", bookingId.toString());
            notes.put("reason",     reason);
            options.put("notes", notes);

            Refund refund = client.payments.refund(razorpayPaymentId, options);
            String refundId = refund.get("id");

            log.info("Refund created: refundId={} paymentId={} bookingId={} amount=₹{}",
                refundId, razorpayPaymentId, bookingId, amountINR);
            return refundId;

        } catch (RazorpayException e) {
            log.error("Razorpay refund failed: paymentId={} bookingId={} error={}",
                razorpayPaymentId, bookingId, e.getMessage());
            throw new RuntimeException("Razorpay refund failed: " + e.getMessage(), e);
        }
    }

    // ── RazorpayX: Contact creation ───────────────────────────────────────────

    public String createContact(
        UUID ownerId,
        String name,
        String email,
        String phone
    ) {
        // NOTE: Razorpay Java SDK 1.4.x does not fully support RazorpayX (Contact).
        // For Phase 1, we simulate the contact creation.
        // In a real system, use Spring's RestTemplate to POST to api.razorpay.com/v1/contacts.
        
        String contactId = "cont_" + ownerId.toString().replace("-", "").substring(0, 14);
        log.info("RazorpayX contact created (MOCK): contactId={} ownerId={}", contactId, ownerId);
        return contactId;
    }

    @CircuitBreaker(name = "razorpay")
    @Retry(name = "razorpay")
    public String createFundAccount(
        String contactId,
        String accountNumber,
        String ifsc,
        String upiId
    ) {
        try {
            // Fortunately, FundAccount DOES exist in the SDK
            JSONObject options = new JSONObject();
            options.put("contact_id", contactId);
            
            if (upiId != null && !upiId.isBlank()) {
                options.put("account_type", "vpa");
                JSONObject vpa = new JSONObject();
                vpa.put("address", upiId);
                options.put("vpa", vpa);
            } else {
                options.put("account_type", "bank_account");
                JSONObject bankAccount = new JSONObject();
                bankAccount.put("name", "Account Holder");
                bankAccount.put("ifsc", ifsc);
                bankAccount.put("account_number", accountNumber);
                options.put("bank_account", bankAccount);
            }

            RazorpayClient client = client();
            FundAccount fa = client.fundAccount.create(options);
            String fundAccountId = fa.get("id");

            log.info("RazorpayX fund account created: faId={} contactId={} type={}",
                fundAccountId, contactId, upiId != null ? "UPI" : "BANK");
            return fundAccountId;

        } catch (RazorpayException e) {
            log.error("RazorpayX fund account creation failed: contactId={} error={}",
                contactId, e.getMessage());
            throw new RuntimeException("RazorpayX fund account creation failed: " + e.getMessage(), e);
        }
    }

    // ── RazorpayX: Payout initiation ──────────────────────────────────────────

    public String initiatePayout(
        String fundAccountId,
        BigDecimal amountINR,
        String referenceId,
        String narration,
        boolean isUpi
    ) {
        try {
            String mode = isUpi ? "UPI"
                : (amountINR.compareTo(new BigDecimal("200000")) >= 0 ? "NEFT" : "IMPS");

            // Mock payout initiation since SDK doesn't support Payouts natively
            String rpPayoutId = "pout_" + referenceId.replace("-", "").substring(0, 14);

            log.info("RazorpayX payout initiated (MOCK): rpPayoutId={} faId={} amount=₹{} mode={}",
                rpPayoutId, fundAccountId, amountINR, mode);
            return rpPayoutId;

        } catch (Exception e) {
            log.error("RazorpayX payout failed: faId={} ref={} amount=₹{} error={}",
                fundAccountId, referenceId, amountINR, e.getMessage());
            throw new RuntimeException("RazorpayX payout initiation failed: " + e.getMessage(), e);
        }
    }

    // ── Webhook signature verification ────────────────────────────────────────

    public void verifyWebhookSignature(String rawBody, String signature) {
        if (signature == null || signature.isBlank()) {
            throw new IllegalArgumentException("Missing signature");
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] expected = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String expectedHex = bytesToHex(expected);

            // CONSTANT-TIME comparison — prevents timing side-channel attacks
            if (!MessageDigest.isEqual(expectedHex.getBytes(StandardCharsets.UTF_8), 
                                       signature.getBytes(StandardCharsets.UTF_8))) {
                log.warn("Webhook signature mismatch — rejecting request");
                throw new IllegalArgumentException("Invalid Razorpay webhook signature");
            }
        } catch (Exception e) {
            log.warn("Webhook signature verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("Webhook signature verification failed: " + e.getMessage(), e);
        }
    }

    private JSONObject createOrderFallback(BigDecimal amountINR, UUID bookingId, 
                                           String paymentKind, String currency, Exception ex) {
        log.error("Razorpay circuit breaker OPEN for booking {}: {}", bookingId, ex.getMessage());
        throw new BusinessException("Payment gateway temporarily unavailable. Please retry.", 
                                    "RAZORPAY_UNAVAILABLE");
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ── Connectivity Check ────────────────────────────────────────────────────

    /**
     * Lightweight connectivity check. Returns true if Razorpay API is reachable.
     */
    public boolean ping() {
        try {
            // A simple initialization check. Real connectivity checks might hit an endpoint,
            // but simply checking if the client instantiates properly without exception
            // helps verify keys aren't totally broken.
            // For a true network ping, one could list customers limit 1: client().customers.fetchAll(new JSONObject().put("count", 1));
            // We'll do a simple list orders with count 1 to verify network + auth.
            JSONObject options = new JSONObject();
            options.put("count", 1);
            client().orders.fetchAll(options);
            return true;
        } catch (Exception e) {
            log.warn("Razorpay ping failed: {}", e.getMessage());
            return false;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private RazorpayClient client() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }

    private long toPaise(BigDecimal amountINR) {
        return amountINR
            .setScale(2, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(0, RoundingMode.HALF_UP)
            .longValue();
    }

    public static BigDecimal fromPaise(long paise) {
        return BigDecimal.valueOf(paise)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
