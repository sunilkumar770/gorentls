package com.rentit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentit.config.IntegrationTestBase;
import com.rentit.dto.payment.ConfirmPaymentRequest;
import com.rentit.dto.payment.CreateOrderRequest;
import com.rentit.model.Booking;
import com.rentit.model.User;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.PaymentRepository;
import com.rentit.service.BookingEscrowService;
import com.rentit.service.RazorpayIntegrationService;
import org.json.JSONObject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class BookingPaymentControllerTest extends IntegrationTestBase {

    @Autowired MockMvc       mvc;
    @Autowired ObjectMapper  json;

    @MockBean BookingRepository          bookingRepo;
    @MockBean PaymentRepository          paymentRepo;
    @MockBean RazorpayIntegrationService razorpay;
    @MockBean BookingEscrowService       escrowService;

    private static final String RENTER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    // ── POST /api/payments/order ──────────────────────────────────────────────

    @Test
    @WithMockUser(username = RENTER_ID, roles = "RENTER")
    @DisplayName("POST /api/payments/order → 200 with Razorpay order JSON")
    void createOrderReturns200() throws Exception {
        UUID bookingId = UUID.randomUUID();
        Booking booking = stubBooking(bookingId, UUID.fromString(RENTER_ID));

        when(bookingRepo.findById(bookingId)).thenReturn(Optional.of(booking));

        JSONObject fakeOrder = new JSONObject();
        fakeOrder.put("id", "order_test_abc");
        fakeOrder.put("amount", 60000L);
        fakeOrder.put("currency", "INR");
        when(razorpay.createOrder(any(), any(), any(), any())).thenReturn(fakeOrder);

        CreateOrderRequest req = new CreateOrderRequest(bookingId, "ADVANCE");

        mvc.perform(post("/api/payments/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(req)))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.id").value("order_test_abc"))
           .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    @WithMockUser(username = RENTER_ID, roles = "RENTER")
    @DisplayName("POST /api/payments/order → 404 for unknown booking")
    void createOrderUnknownBooking() throws Exception {
        UUID bookingId = UUID.randomUUID();
        when(bookingRepo.findById(bookingId)).thenReturn(Optional.empty());

        CreateOrderRequest req = new CreateOrderRequest(bookingId, "ADVANCE");

        mvc.perform(post("/api/payments/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(req)))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.errorCode").value("BOOKING_NOT_FOUND"));
    }

    @Test
    @DisplayName("POST /api/payments/order without auth → 401")
    void createOrderRequiresAuth() throws Exception {
        mvc.perform(post("/api/payments/order")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
           .andExpect(status().isUnauthorized());
    }

    // ── POST /api/payments/confirm ────────────────────────────────────────────

    @Test
    @WithMockUser(username = RENTER_ID, roles = "RENTER")
    @DisplayName("POST /api/payments/confirm with valid signature → 200 APPLIED")
    void confirmPaymentApplied() throws Exception {
        UUID bookingId = UUID.randomUUID();
        Booking booking = stubBooking(bookingId, UUID.fromString(RENTER_ID));

        when(bookingRepo.findById(bookingId)).thenReturn(Optional.of(booking));
        when(razorpay.verifyPaymentSignature(any(), any(), any())).thenReturn(true);
        when(paymentRepo.existsByRazorpayPaymentId(any())).thenReturn(false);
        doNothing().when(escrowService).applyPayment(any(), any());

        ConfirmPaymentRequest req = new ConfirmPaymentRequest(
            bookingId,
            "order_test_001",
            "pay_test_001",
            "valid_sig_abc",
            "ADVANCE"
        );

        mvc.perform(post("/api/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(req)))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("APPLIED"));
    }

    @Test
    @WithMockUser(username = RENTER_ID, roles = "RENTER")
    @DisplayName("POST /api/payments/confirm with invalid signature → 400")
    void confirmPaymentInvalidSignature() throws Exception {
        UUID bookingId = UUID.randomUUID();
        Booking booking = stubBooking(bookingId, UUID.fromString(RENTER_ID));

        when(bookingRepo.findById(bookingId)).thenReturn(Optional.of(booking));
        when(razorpay.verifyPaymentSignature(any(), any(), any())).thenReturn(false);

        ConfirmPaymentRequest req = new ConfirmPaymentRequest(
            bookingId,
            "order_test_001",
            "pay_test_001",
            "tampered_sig",
            "ADVANCE"
        );

        mvc.perform(post("/api/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(req)))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errorCode").value("INVALID_PAYMENT_SIGNATURE"));

        verify(escrowService, never()).applyPayment(any(), any());
    }

    // ── GET /api/payments/escrow/{bookingId} ──────────────────────────────────

    @Test
    @WithMockUser(username = RENTER_ID, roles = "RENTER")
    @DisplayName("GET /api/payments/escrow/{bookingId} → 200 with correct summary fields")
    void getEscrowSummaryReturns200() throws Exception {
        UUID bookingId = UUID.randomUUID();
        Booking booking = stubBooking(bookingId, UUID.fromString(RENTER_ID));
        when(bookingRepo.findById(bookingId)).thenReturn(Optional.of(booking));

        mvc.perform(get("/api/payments/escrow/{bookingId}", bookingId))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.bookingId").value(bookingId.toString()))
           .andExpect(jsonPath("$.escrowStatus").value("ADVANCE_HELD"))
           .andExpect(jsonPath("$.advanceAmount").value(600.00))
           .andExpect(jsonPath("$.disputeWindowOpen").value(true));
    }

    // ── POST /api/payments/refund — ADMIN only ────────────────────────────────

    @Test
    @WithMockUser(username = RENTER_ID, roles = "RENTER")
    @DisplayName("POST /api/payments/refund with RENTER role → 403")
    void refundForbiddenForRenter() throws Exception {
        mvc.perform(post("/api/payments/refund")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bookingId\":\"" + UUID.randomUUID() + "\"}"))
           .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin-001", roles = "ADMIN")
    @DisplayName("POST /api/payments/refund validation → 400 missing fields")
    void refundValidationFails() throws Exception {
        // Empty body should fail @Valid
        mvc.perform(post("/api/payments/refund")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
           .andExpect(jsonPath("$.violations").isMap());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Booking stubBooking(UUID id, UUID renterId) {
        User renter = new User();
        renter.setId(renterId);

        Booking b = new Booking();
        b.setId(id);
        b.setRenter(renter);
        b.setBookingStatus(BookingStatus.CONFIRMED);
        b.setEscrowStatus(EscrowStatus.ADVANCE_HELD);
        b.setAdvanceAmount(new BigDecimal("600.00"));
        b.setRemainingAmount(new BigDecimal("1400.00"));
        b.setSecurityDeposit(new BigDecimal("500.00"));
        b.setPlatformFee(new BigDecimal("240.00"));
        b.setGstAmount(new BigDecimal("43.20"));
        b.setDisputeWindowEndsAt(Instant.now().plusSeconds(86400));
        return b;
    }
}
