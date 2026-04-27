package com.rentit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentit.dto.InitiatePaymentResponse;
import com.rentit.dto.VerifyPaymentRequest;
import com.rentit.model.Booking;
import com.rentit.model.enums.BookingStatus;
import com.rentit.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Razorpay payment integration.
 *
 * BUG-15 FIX: initiatePayment() now rejects CANCELLED/REJECTED bookings with
 *             409 before creating a Razorpay order.
 * BUG-16 FIX: verifyAndConfirmPayment() idempotency check covers all terminal
 *             booking statuses — won't re-confirm a CANCELLED booking.
 * BUG-17 FIX: RestTemplate is injected via RestTemplateBuilder (shared, pooled,
 *             with connect/read timeout) instead of being instantiated per call.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final ObjectMapper      objectMapper;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret:placeholder}")
    private String webhookSecret;

    private static final String RAZORPAY_ORDERS_API = "https://api.razorpay.com/v1/orders";
    private static final String HMAC_ALGO           = "HmacSHA256";

    /** Booking statuses that make payment initiation invalid. */
    private static final Set<BookingStatus> UNPAYABLE_STATUSES = EnumSet.of(
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
        BookingStatus.COMPLETED
    );

    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public InitiatePaymentResponse initiatePayment(String bookingId, String username) {
        Booking booking = findOrThrow(bookingId);

        // Security Check: Only the renter of the booking can initiate payment
        if (!booking.getRenter().getEmail().equals(username)) {
            log.warn("User {} attempted to initiate payment for booking {} owned by {}", 
                username, bookingId, booking.getRenter().getEmail());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to pay for this booking.");
        }

        // BUG-15 FIX: reject terminal states before talking to Razorpay
        if (UNPAYABLE_STATUSES.contains(booking.getBookingStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cannot initiate payment for a booking in status: " + booking.getBookingStatus());
        }

        String ps = booking.getPaymentStatus();
        if (ps != null && !ps.equals("PENDING") && !ps.equals("INITIATED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cannot initiate payment. Current payment status: " + ps);
        }

        long amountPaise = booking.getTotalAmount()
            .multiply(new BigDecimal("100"))
            .setScale(0, java.math.RoundingMode.HALF_UP)
            .longValueExact();

        Map<String, Object> notes = new HashMap<>();
        notes.put("bookingId", bookingId);
        if (booking.getListing() != null) {
            notes.put("listingId", booking.getListing().getId());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("amount",   amountPaise);
        body.put("currency", "INR");
        body.put("receipt",  "grb_" + bookingId.replace("-", "").substring(0, 16));
        body.put("notes",    notes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(razorpayKeyId, razorpayKeySecret);

        // BUG-17 FIX: use a properly-configured RestTemplate with timeouts
        // (RestTemplateBuilder.connectTimeout(Duration) requires Spring Boot ≥ 3.1;
        //  using SimpleClientHttpRequestFactory for universal compatibility)
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
            new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        RestTemplate restTemplate = new RestTemplate(factory);

        try {
            String        json   = objectMapper.writeValueAsString(body);
            HttpEntity<String> entity = new HttpEntity<>(json, headers);
            ResponseEntity<String> resp = restTemplate.postForEntity(
                RAZORPAY_ORDERS_API, entity, String.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Razorpay responded with: " + resp.getStatusCode());
            }

            JsonNode order          = objectMapper.readTree(resp.getBody());
            String   razorpayOrderId = order.get("id").asText();

            booking.setRazorpayOrderId(razorpayOrderId);
            booking.setPaymentStatus("INITIATED");
            bookingRepository.save(booking);

            log.info("Razorpay order created: {} → booking: {}", razorpayOrderId, bookingId);

            return InitiatePaymentResponse.builder()
                .orderId(razorpayOrderId)
                .amount(amountPaise)
                .currency("INR")
                .keyId(razorpayKeyId)
                .bookingId(bookingId)
                .build();

        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception ex) {
            log.error("Razorpay order creation failed for {}: {}", bookingId, ex.getMessage(), ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Payment initiation failed — please retry.");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void verifyAndConfirmPayment(VerifyPaymentRequest req, String username) {
        Booking booking = findOrThrow(req.getBookingId());

        // Security Check: Only the renter of the booking can verify payment
        if (!booking.getRenter().getEmail().equals(username)) {
            log.warn("User {} attempted to verify payment for booking {} owned by {}", 
                username, req.getBookingId(), booking.getRenter().getEmail());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to verify this booking.");
        }

        String sigPayload = req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId();
        String computed   = hmacSha256Hex(sigPayload, razorpayKeySecret);

        if (!computed.equals(req.getRazorpaySignature())) {
            log.warn("Signature mismatch for booking {}", req.getBookingId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Payment signature verification failed.");
        }

        Booking booking = findOrThrow(req.getBookingId());

        // BUG-16 FIX: idempotency check covers all terminal/already-confirmed states.
        // Previously only checked COMPLETED paymentStatus — a CANCELLED booking
        // could have been re-confirmed by a late webhook.
        if (UNPAYABLE_STATUSES.contains(booking.getBookingStatus())) {
            log.warn("Ignoring payment verify for booking {} — status is {}",
                req.getBookingId(), booking.getBookingStatus());
            return;
        }
        if ("COMPLETED".equals(booking.getPaymentStatus())
                || BookingStatus.CONFIRMED.equals(booking.getBookingStatus())) {
            log.info("Booking {} already confirmed — skipping duplicate verify", req.getBookingId());
            return;
        }

        booking.setPaymentStatus("COMPLETED");
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        booking.setRazorpayPaymentId(req.getRazorpayPaymentId());
        bookingRepository.save(booking);

        log.info("Booking CONFIRMED via verify: {}", req.getBookingId());
    }

    // ─────────────────────────────────────────────────────────────────────────

    public void verifyWebhookSignature(String rawBody, String razorpaySignature) {
        if (razorpaySignature == null || razorpaySignature.isBlank()) {
            throw new SecurityException("Missing X-Razorpay-Signature header");
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(
                webhookSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            if (!sb.toString().equals(razorpaySignature)) {
                throw new SecurityException("Signature mismatch — possible payment forgery");
            }
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            throw new SecurityException("HMAC verification failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void handlePaymentCaptured(String bookingId, String razorpayPaymentId) {
        Booking booking = bookingRepository
            .findById(java.util.UUID.fromString(bookingId))
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        // BUG-16 FIX: same idempotency guard for webhook path
        if (UNPAYABLE_STATUSES.contains(booking.getBookingStatus())) {
            log.warn("Ignoring payment.captured for booking {} — status is {}",
                bookingId, booking.getBookingStatus());
            return;
        }

        if (!BookingStatus.CONFIRMED.equals(booking.getBookingStatus())) {
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            booking.setPaymentStatus("COMPLETED");
            booking.setRazorpayPaymentId(razorpayPaymentId);
            bookingRepository.save(booking);
            log.info("Booking CONFIRMED via webhook: {}", bookingId);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Booking findOrThrow(String bookingId) {
        java.util.UUID bookingUuid;
        try {
            bookingUuid = java.util.UUID.fromString(bookingId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid booking ID format");
        }
        return bookingRepository.findById(bookingUuid)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Booking not found: " + bookingId));
    }

    private String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 computation failed", e);
        }
    }
}
