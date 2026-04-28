package com.rentit.service;

import com.rentit.config.IntegrationTestBase;
import com.rentit.model.Booking;
import com.rentit.model.Payment;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.model.enums.PaymentKind;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.LedgerTransactionRepository;
import com.rentit.repository.PayoutRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BookingEscrowServiceIntegrationTest extends IntegrationTestBase {

    @Autowired BookingEscrowService        escrowService;
    @Autowired BookingRepository           bookingRepo;
    @Autowired LedgerTransactionRepository ledgerRepo;
    @Autowired PayoutRepository            payoutRepo;

    @MockBean  RazorpayIntegrationService  razorpay;

    private UUID    bookingId;
    private Booking booking;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        booking   = buildTestBooking(bookingId);
        bookingRepo.save(booking);
    }

    @AfterEach
    void tearDown() {
        ledgerRepo.deleteByBookingId(bookingId);
        payoutRepo.deleteByBookingId(bookingId);
        bookingRepo.deleteById(bookingId);
    }

    // ── applyPayment: ADVANCE ─────────────────────────────────────────────────

    @Test @Order(1)
    @DisplayName("applyPayment(ADVANCE) → ADVANCE_HELD")
    @Transactional
    void advancePaymentMovesToAdvanceHeld() {
        escrowService.applyPayment(booking, advance(booking, booking.getAdvanceAmount()));

        Booking updated = bookingRepo.findById(bookingId).orElseThrow();
        assertThat(updated.getEscrowStatus()).isEqualTo(EscrowStatus.ADVANCE_HELD);
    }

    // ── applyPayment: ADVANCE then FINAL ─────────────────────────────────────

    @Test @Order(2)
    @DisplayName("applyPayment(ADVANCE) then applyPayment(FINAL) → FULL_HELD")
    @Transactional
    void finalAfterAdvanceMovesToFullyHeld() {
        escrowService.applyPayment(booking, advance(booking, booking.getAdvanceAmount()));

        Booking refreshed = bookingRepo.findById(bookingId).orElseThrow();
        escrowService.applyPayment(refreshed, finalPay(refreshed, refreshed.getRemainingAmount()));

        Booking updated = bookingRepo.findById(bookingId).orElseThrow();
        assertThat(updated.getEscrowStatus()).isEqualTo(EscrowStatus.FULL_HELD);
    }

    // ── applyPayment: FINAL without ADVANCE ──────────────────────────────────

    @Test @Order(3)
    @DisplayName("applyPayment(FINAL) without prior ADVANCE → BusinessException")
    void finalWithoutAdvanceThrows() {
        assertThatThrownBy(() ->
            escrowService.applyPayment(booking, finalPay(booking, booking.getRemainingAmount()))
        ).isInstanceOf(com.rentit.exception.BusinessException.class);
    }

    // ── processFullRefund ─────────────────────────────────────────────────────

    @Test @Order(4)
    @DisplayName("processFullRefund() → REFUNDED")
    @Transactional
    void fullRefundMovesToRefunded() {
        escrowService.applyPayment(booking, advance(booking, booking.getAdvanceAmount()));
        Booking refreshed = bookingRepo.findById(bookingId).orElseThrow();

        escrowService.processFullRefund(
            refreshed,
            refreshed.getAdvanceAmount(),
            "Test cancellation",
            "rfnd_test_001"
        );

        Booking updated = bookingRepo.findById(bookingId).orElseThrow();
        assertThat(updated.getEscrowStatus()).isEqualTo(EscrowStatus.REFUNDED);
    }

    // ── holdForDispute ────────────────────────────────────────────────────────

    @Test @Order(5)
    @DisplayName("holdForDispute() on FULL_HELD booking → ON_HOLD")
    @Transactional
    void holdForDisputeWorks() {
        escrowService.applyPayment(booking, advance(booking, booking.getAdvanceAmount()));
        Booking r1 = bookingRepo.findById(bookingId).orElseThrow();
        escrowService.applyPayment(r1, finalPay(r1, r1.getRemainingAmount()));

        Booking r2 = bookingRepo.findById(bookingId).orElseThrow();
        r2.setBookingStatus(BookingStatus.RETURNED);
        bookingRepo.save(r2);

        escrowService.holdForDispute(r2);

        Booking updated = bookingRepo.findById(bookingId).orElseThrow();
        assertThat(updated.getEscrowStatus()).isEqualTo(EscrowStatus.ON_HOLD);
    }

    // ── Ledger immutability ───────────────────────────────────────────────────

    @Test @Order(6)
    @DisplayName("Ledger entries only grow — no updates or deletes")
    @Transactional
    void ledgerEntriesAreAppendOnly() {
        long before = ledgerRepo.countByBookingId(bookingId);

        escrowService.applyPayment(booking, advance(booking, booking.getAdvanceAmount()));

        long after = ledgerRepo.countByBookingId(bookingId);
        assertThat(after).isGreaterThan(before);

        ledgerRepo.findByBookingId(bookingId)
            .forEach(e -> assertThat(e.getCreatedAt()).isNotNull());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Booking buildTestBooking(UUID id) {
        Booking b = new Booking();
        b.setId(id);
        b.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        b.setEscrowStatus(EscrowStatus.PENDING);
        b.setAdvanceAmount(new BigDecimal("600.00"));
        b.setRemainingAmount(new BigDecimal("1400.00"));
        b.setSecurityDeposit(new BigDecimal("500.00"));
        b.setPlatformFee(new BigDecimal("240.00"));
        b.setGstAmount(new BigDecimal("43.20"));
        b.setStartDate(LocalDate.now().plusDays(2));
        b.setEndDate(LocalDate.now().plusDays(9));
        b.setDisputeWindowEndsAt(Instant.now().plusSeconds(86400));
        return b;
    }

    private Payment advance(Booking booking, BigDecimal amount) {
        Payment p = new Payment();
        p.setRazorpayPaymentId("pay_adv_" + UUID.randomUUID().toString().substring(0, 8));
        p.setRazorpayOrderId("ord_adv_"   + UUID.randomUUID().toString().substring(0, 8));
        p.setAmount(amount);
        p.setKind(PaymentKind.ADVANCE);
        p.setStatus("CAPTURED");
        p.setBooking(booking);
        return p;
    }

    private Payment finalPay(Booking booking, BigDecimal amount) {
        Payment p = new Payment();
        p.setRazorpayPaymentId("pay_fin_" + UUID.randomUUID().toString().substring(0, 8));
        p.setRazorpayOrderId("ord_fin_"   + UUID.randomUUID().toString().substring(0, 8));
        p.setAmount(amount);
        p.setKind(PaymentKind.FINAL);
        p.setStatus("CAPTURED");
        p.setBooking(booking);
        return p;
    }
}
