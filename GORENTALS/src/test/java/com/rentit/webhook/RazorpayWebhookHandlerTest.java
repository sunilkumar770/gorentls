package com.rentit.webhook;

import com.rentit.config.IntegrationTestBase;
import com.rentit.model.Booking;
import com.rentit.model.Payout;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.model.enums.PayoutStatus;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.PaymentRepository;
import com.rentit.repository.PayoutRepository;
import com.rentit.service.BookingEscrowService;
import com.rentit.service.RazorpayIntegrationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class RazorpayWebhookHandlerTest extends IntegrationTestBase {

    @Autowired MockMvc mvc;

    @MockBean RazorpayIntegrationService razorpay;
    @MockBean BookingEscrowService       escrowService;
    @MockBean BookingRepository          bookingRepo;
    @MockBean PaymentRepository          paymentRepo;
    @MockBean PayoutRepository           payoutRepo;

    private static final String URL = "/api/webhooks/razorpay";

    // ── Signature guards ──────────────────────────────────────────────────────

    @Test
    @DisplayName("No X-Razorpay-Signature header → 400, no business logic")
    void missingSignature400() throws Exception {
        mvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"event\":\"payment.captured\"}"))
           .andExpect(status().isBadRequest());

        verifyNoInteractions(escrowService, paymentRepo, payoutRepo);
    }

    @Test
    @DisplayName("Invalid signature → 400, no DB writes")
    void invalidSignature400() throws Exception {
        doThrow(new IllegalArgumentException("Invalid signature"))
            .when(razorpay).verifyWebhookSignature(any(), any());

        mvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "bad_sig")
                .content("{\"event\":\"payment.captured\"}"))
           .andExpect(status().isBadRequest());

        verifyNoInteractions(escrowService, paymentRepo, payoutRepo);
    }

    // ── payment.captured ──────────────────────────────────────────────────────

    @Test
    @DisplayName("payment.captured with valid data → 200, escrow updated")
    void paymentCapturedApplied() throws Exception {
        UUID bookingId = UUID.randomUUID();
        String payId   = "pay_test_abc";

        doNothing().when(razorpay).verifyWebhookSignature(any(), any());
        when(paymentRepo.existsByRazorpayPaymentId(payId)).thenReturn(false);

        Booking b = new Booking();
        b.setId(bookingId);
        b.setAdvanceAmount(new BigDecimal("600.00"));
        when(bookingRepo.findById(bookingId)).thenReturn(Optional.of(b));
        doNothing().when(escrowService).applyPayment(any(), any());

        mvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid_sig")
                .content(capturedPayload(payId, bookingId.toString(), 60000L, "ADVANCE")))
           .andExpect(status().isOk())
           .andExpect(content().string("OK"));

        verify(escrowService).applyPayment(eq(b), any());
    }

    @Test
    @DisplayName("Duplicate payment.captured → 200, applyPayment NOT called (idempotent)")
    void duplicateCapturedIdempotent() throws Exception {
        doNothing().when(razorpay).verifyWebhookSignature(any(), any());
        when(paymentRepo.existsByRazorpayPaymentId("pay_dup")).thenReturn(true);

        mvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid_sig")
                .content(capturedPayload("pay_dup", UUID.randomUUID().toString(), 60000L, "ADVANCE")))
           .andExpect(status().isOk());

        verify(escrowService, never()).applyPayment(any(), any());
    }

    // ── payout.processed ──────────────────────────────────────────────────────

    @Test
    @DisplayName("payout.processed → Payout marked SUCCESS, Booking marked PAID_OUT")
    void payoutProcessedUpdatesStatus() throws Exception {
        String rpPayoutId = "pout_001";
        UUID   bookingId  = UUID.randomUUID();
        UUID   ownerId    = UUID.randomUUID();

        Payout payout = new Payout(
            bookingId, ownerId,
            new BigDecimal("2000.00"),
            BigDecimal.ZERO,
            new BigDecimal("2000.00"),
            "fa_001"
        );

        doNothing().when(razorpay).verifyWebhookSignature(any(), any());
        when(payoutRepo.findByRpPayoutId(rpPayoutId)).thenReturn(Optional.of(payout));

        Booking b = new Booking();
        b.setId(bookingId);
        when(bookingRepo.findById(bookingId)).thenReturn(Optional.of(b));

        mvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid_sig")
                .content(payoutProcessedPayload(rpPayoutId)))
           .andExpect(status().isOk());

        verify(payoutRepo).save(argThat(p -> p.getStatus() == PayoutStatus.SUCCESS));
        verify(bookingRepo).save(argThat(bk -> bk.getEscrowStatus() == EscrowStatus.PAID_OUT));
    }

    // ── Unknown event ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Unknown event → 200 acknowledged, no business logic called")
    void unknownEventIgnored() throws Exception {
        doNothing().when(razorpay).verifyWebhookSignature(any(), any());

        mvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid_sig")
                .content("{\"event\":\"subscription.activated\",\"payload\":{}}"))
           .andExpect(status().isOk())
           .andExpect(content().string("OK"));

        verifyNoInteractions(escrowService, paymentRepo, payoutRepo);
    }

    // ── Payload builders ──────────────────────────────────────────────────────

    private String capturedPayload(String payId, String bookingId, long paise, String kind) {
        return """
            {
              "event": "payment.captured",
              "payload": {
                "payment": {
                  "entity": {
                    "id": "%s",
                    "order_id": "order_test_001",
                    "amount": %d,
                    "currency": "INR",
                    "status": "captured",
                    "notes": { "booking_id": "%s", "payment_kind": "%s" }
                  }
                }
              }
            }""".formatted(payId, paise, bookingId, kind);
    }

    private String payoutProcessedPayload(String rpPayoutId) {
        return """
            {
              "event": "payout.processed",
              "payload": {
                "payout": {
                  "entity": {
                    "id": "%s",
                    "status": "processed",
                    "amount": 200000,
                    "currency": "INR"
                  }
                }
              }
            }""".formatted(rpPayoutId);
    }
}
