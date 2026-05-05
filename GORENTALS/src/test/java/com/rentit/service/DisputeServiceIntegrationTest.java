package com.rentit.service;

import com.rentit.config.IntegrationTestBase;
import com.rentit.exception.BusinessException;
import com.rentit.model.Booking;
import com.rentit.model.Dispute;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.DisputeStatus;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.DisputeRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DisputeServiceIntegrationTest extends IntegrationTestBase {

    @Autowired DisputeService    disputeService;
    @Autowired DisputeRepository disputeRepo;
    @Autowired BookingRepository bookingRepo;

    @MockBean  RazorpayIntegrationService razorpay;
    @MockBean  BookingEscrowService       escrowService;

    private UUID    bookingId;
    private UUID    renterId;
    private Booking booking;

    @BeforeEach
    void setUp() {
        renterId  = UUID.randomUUID();
        bookingId = UUID.randomUUID();
        booking   = returnedBooking(bookingId);
        bookingRepo.save(booking);
    }

    @AfterEach
    void tearDown() {
        disputeRepo.deleteByBookingId(bookingId);
        bookingRepo.deleteById(bookingId);
    }

    // ── openDispute ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("openDispute() creates OPEN dispute and freezes escrow")
    @Transactional
    void openDisputeCreatesRecord() {
        doNothing().when(escrowService).holdForDispute(any());

        Dispute d = disputeService.openDispute(
            bookingId, renterId, "RENTER", "DAMAGED_ITEM",
            "Item was severely damaged when received.",
            List.of("https://s3.example.com/ev1.jpg")
        );

        assertThat(d.getId()).isNotNull();
        assertThat(d.getStatus()).isEqualTo(DisputeStatus.OPEN);
        assertThat(d.getReasonCode()).isEqualTo("DAMAGED_ITEM");
        assertThat(d.getEvidenceUrls()).hasSize(1);
        verify(escrowService).holdForDispute(any(Booking.class));
    }

    @Test
    @DisplayName("openDispute() with PENDING booking → DISPUTE_INELIGIBLE_STATUS")
    void pendingBookingCannotBeDisputed() {
        booking.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        bookingRepo.save(booking);

        assertThatThrownBy(() -> disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "Description that is long enough to pass.",
            List.of()
        )).isInstanceOf(BusinessException.class)
          .hasMessageContaining("DISPUTE_INELIGIBLE_STATUS");
    }

    @Test
    @DisplayName("openDispute() after window expired → DISPUTE_WINDOW_EXPIRED")
    void expiredWindowCannotBeDisputed() {
        booking.setDisputeWindowEndsAt(Instant.now().minusSeconds(3600));
        bookingRepo.save(booking);

        assertThatThrownBy(() -> disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "Description that is long enough to pass.",
            List.of()
        )).isInstanceOf(BusinessException.class)
          .hasMessageContaining("DISPUTE_WINDOW_EXPIRED");
    }

    @Test
    @DisplayName("openDispute() twice → DISPUTE_ALREADY_ACTIVE")
    @Transactional
    void cannotHaveTwoActiveDisputes() {
        doNothing().when(escrowService).holdForDispute(any());

        disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "First dispute — long enough to pass validation.",
            List.of()
        );

        assertThatThrownBy(() -> disputeService.openDispute(
            bookingId, renterId, "RENTER", "LATE_RETURN",
            "Second dispute — long enough to pass validation.",
            List.of()
        )).isInstanceOf(BusinessException.class)
          .hasMessageContaining("DISPUTE_ALREADY_ACTIVE");
    }

    @Test
    @DisplayName("description shorter than 20 chars → DISPUTE_DESCRIPTION_TOO_SHORT")
    void shortDescriptionThrows() {
        assertThatThrownBy(() -> disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "Too short",
            List.of()
        )).isInstanceOf(BusinessException.class)
          .hasMessageContaining("20 characters");
    }

    // ── Admin: resolveRefund ──────────────────────────────────────────────────

    @Test
    @DisplayName("resolveRefund() → RESOLVED_REFUND + processFullRefund called")
    @Transactional
    void resolveRefundWorks() {
        doNothing().when(escrowService).holdForDispute(any());
        when(razorpay.createRefund(any(), any(), any(), any())).thenReturn("rfnd_001");
        doNothing().when(escrowService).processFullRefund(any(), any(), any(), any());

        UUID adminId = UUID.randomUUID();
        Dispute d = disputeService.openDispute(
            bookingId, renterId, "RENTER", "NOT_DELIVERED",
            "Item was never delivered to the pickup point.",
            List.of()
        );
        disputeService.startReview(d.getId(), adminId);

        Dispute resolved = disputeService.resolveRefund(
            d.getId(), adminId,
            "GPS logs confirm non-delivery.",
            "pay_12345",
            new BigDecimal("600.00")
        );

        assertThat(resolved.getStatus()).isEqualTo(DisputeStatus.RESOLVED_REFUND);
        assertThat(resolved.getRenterRefundAmt()).isEqualByComparingTo("600.00");
        verify(escrowService).processFullRefund(
            any(), eq(new BigDecimal("600.00")), any(), eq("MULTI_REFUND")
        );
    }

    // ── Admin: rejectDispute ──────────────────────────────────────────────────

    @Test
    @DisplayName("rejectDispute() → REJECTED + resolveDisputeRejected called")
    @Transactional
    void rejectDisputeWorks() {
        doNothing().when(escrowService).holdForDispute(any());
        doNothing().when(escrowService).resolveDisputeRejected(any(), any());

        UUID adminId = UUID.randomUUID();
        Dispute d = disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "Frivolous claim — enough characters to pass.",
            List.of()
        );

        Dispute rejected = disputeService.rejectDispute(
            d.getId(), adminId,
            "Rejected: no supporting evidence provided.",
            BigDecimal.ZERO
        );

        assertThat(rejected.getStatus()).isEqualTo(DisputeStatus.REJECTED);
        assertThat(rejected.getResolvedBy()).isEqualTo(adminId);
        verify(escrowService).resolveDisputeRejected(any(), eq(BigDecimal.ZERO));
    }

    // ── Idempotency: double-resolve ───────────────────────────────────────────

    @Test
    @DisplayName("resolving an already-resolved dispute → DISPUTE_ALREADY_RESOLVED")
    @Transactional
    void cannotResolveResolvedDispute() {
        doNothing().when(escrowService).holdForDispute(any());
        doNothing().when(escrowService).resolveDisputeRejected(any(), any());

        UUID adminId = UUID.randomUUID();
        Dispute d = disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "Description that is long enough to pass validation.",
            List.of()
        );
        disputeService.rejectDispute(d.getId(), adminId, "First rejection.", BigDecimal.ZERO);

        assertThatThrownBy(() ->
            disputeService.rejectDispute(d.getId(), adminId, "Second rejection.", BigDecimal.ZERO)
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("DISPUTE_ALREADY_RESOLVED");
    }

    // ── startReview ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("startReview() on non-OPEN dispute → DISPUTE_NOT_OPEN")
    @Transactional
    void startReviewOnNonOpenThrows() {
        doNothing().when(escrowService).holdForDispute(any());
        doNothing().when(escrowService).resolveDisputeRejected(any(), any());

        UUID adminId = UUID.randomUUID();
        Dispute d = disputeService.openDispute(
            bookingId, renterId, "RENTER", "OTHER",
            "Description that is long enough to pass validation.",
            List.of()
        );
        disputeService.rejectDispute(d.getId(), adminId, "Already resolved.", BigDecimal.ZERO);

        assertThatThrownBy(() ->
            disputeService.startReview(d.getId(), adminId)
        ).isInstanceOf(BusinessException.class)
         .hasMessageContaining("DISPUTE_NOT_OPEN");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Booking returnedBooking(UUID id) {
        Booking b = new Booking();
        b.setId(id);
        b.setBookingStatus(BookingStatus.RETURNED);
        b.setEscrowStatus(EscrowStatus.FULL_HELD);
        b.setAdvanceAmount(new BigDecimal("600.00"));
        b.setRemainingAmount(new BigDecimal("1400.00"));
        b.setPlatformFee(new BigDecimal("240.00"));
        b.setGstAmount(new BigDecimal("43.20"));
        b.setStartDate(LocalDate.now().minusDays(7));
        b.setEndDate(LocalDate.now().minusDays(1));
        b.setReturnedAt(Instant.now().minusSeconds(3600));
        b.setDisputeWindowEndsAt(Instant.now().plusSeconds(82800));
        return b;
    }
}
