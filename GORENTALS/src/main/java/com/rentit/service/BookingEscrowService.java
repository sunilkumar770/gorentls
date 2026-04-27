package com.rentit.service;

import com.rentit.exception.BusinessException;
import com.rentit.exception.InvalidStateTransitionException;
import com.rentit.model.Booking;
import com.rentit.model.Payment;
import com.rentit.model.enums.*;
import com.rentit.pricing.PricingCalculator;
import com.rentit.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Controls ALL escrow state transitions and financial postings for a booking.
 *
 * DESIGN CONTRACT:
 *   - BookingService   → calls this for payment events and lifecycle changes.
 *   - PayoutEngine     → calls scheduleForPayout() when dispute window expires.
 *   - DisputeService   → calls holdForDispute() and resolveDispute() variants.
 *   - RazorpayWebhookHandler → calls applyPayment() after PG verification.
 *
 *   No other class should directly mutate booking_status or escrow_status.
 *   All ledger postings go through LedgerService — never write
 *   LedgerTransaction rows directly here.
 *
 * TRANSACTION POLICY:
 *   Every public method is @Transactional.
 *   LedgerService methods use Propagation.MANDATORY — they MUST run inside
 *   an existing transaction (which these methods provide).
 */
@Service
public class BookingEscrowService {

    private static final Logger log = LoggerFactory.getLogger(BookingEscrowService.class);

    /** Dispute window: 24 hours after item return. Owner has 24h to raise a dispute. */
    private static final long DISPUTE_WINDOW_HOURS = 24L;

    private final BookingRepository bookingRepo;
    private final LedgerService     ledger;

    public BookingEscrowService(
        BookingRepository bookingRepo,
        LedgerService     ledger
    ) {
        this.bookingRepo = bookingRepo;
        this.ledger      = ledger;
    }

    // ── Payment application ───────────────────────────────────────────────────

    /**
     * Apply a verified PG payment to the booking's escrow state.
     *
     * Called by RazorpayWebhookHandler AFTER signature verification.
     * Never call this speculatively — only after the PG confirms capture.
     *
     * Routes to the correct handler based on payment kind.
     */
    @Transactional
    public void applyPayment(Booking booking, Payment payment) {
        log.info("Applying payment: kind={} amount=₹{} booking={}",
            payment.getKind(), payment.getAmount(), booking.getId());

        switch (payment.getKind()) {
            case ADVANCE          -> applyAdvance(booking, payment);
            case FINAL            -> applyFinal(booking, payment);
            case SECURITY_DEPOSIT -> applyDeposit(booking, payment);
            default               -> throw new BusinessException(
                "Unhandled payment kind in escrow: " + payment.getKind(),
                "UNSUPPORTED_PAYMENT_KIND"
            );
        }

        bookingRepo.save(booking);
        log.info("Escrow updated: booking={} bookingStatus={} escrowStatus={}",
            booking.getId(), booking.getBookingStatus(), booking.getEscrowStatus());
    }

    private void applyAdvance(Booking booking, Payment payment) {
        guardBookingStatus(booking, BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED);

        booking.setAdvanceAmount(payment.getAmount());
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        booking.setEscrowStatus(EscrowStatus.ADVANCE_HELD);

        ledger.post(
            booking.getId(), payment.getId(),
            LedgerAccount.BANK_SETTLEMENT, LedgerAccount.RENTER_ESCROW,
            payment.getAmount(),
            "Advance payment captured — booking confirmed"
        );
    }

    private void applyFinal(Booking booking, Payment payment) {
        guardEscrowStatus(booking, EscrowStatus.ADVANCE_HELD, EscrowStatus.FULL_HELD);

        booking.setRemainingAmount(payment.getAmount());
        booking.setEscrowStatus(EscrowStatus.FULL_HELD);
        booking.setBookingStatus(BookingStatus.IN_USE);

        ledger.post(
            booking.getId(), payment.getId(),
            LedgerAccount.BANK_SETTLEMENT, LedgerAccount.RENTER_ESCROW,
            payment.getAmount(),
            "Final payment captured — item in use"
        );
    }

    private void applyDeposit(Booking booking, Payment payment) {
        // Deposit is collected alongside the advance in Phase 1.
        // No booking status change — just post to SECURITY_HOLD.
        ledger.post(
            booking.getId(), payment.getId(),
            LedgerAccount.BANK_SETTLEMENT, LedgerAccount.SECURITY_HOLD,
            payment.getAmount(),
            "Security deposit captured"
        );
    }

    // ── Lifecycle transitions ─────────────────────────────────────────────────

    /**
     * Owner marks item handed over to renter.
     * Records handover timestamp — used to compute rental duration.
     * Does NOT change booking status (stays CONFIRMED until final payment collected).
     */
    @Transactional
    public void markHandover(Booking booking) {
        if (booking.getBookingStatus() != BookingStatus.CONFIRMED)
            throw new InvalidStateTransitionException(
                booking.getBookingStatus(), BookingStatus.IN_USE, "Booking"
            );

        booking.setHandoverAt(Instant.now());
        bookingRepo.save(booking);

        log.info("Handover recorded: booking={} at={}", booking.getId(), booking.getHandoverAt());
    }

    /**
     * Owner confirms item returned by renter.
     * Opens the 24-hour dispute window.
     * Booking moves RETURNED; escrow stays FULL_HELD (no payout yet).
     */
    @Transactional
    public void markReturn(Booking booking) {
        if (booking.getBookingStatus() != BookingStatus.IN_USE)
            throw new InvalidStateTransitionException(
                booking.getBookingStatus(), BookingStatus.RETURNED, "Booking"
            );

        Instant now                 = Instant.now();
        Instant disputeWindowEnds   = now.plus(DISPUTE_WINDOW_HOURS, ChronoUnit.HOURS);

        booking.setReturnedAt(now);
        booking.setDisputeWindowEndsAt(disputeWindowEnds);
        booking.setBookingStatus(BookingStatus.RETURNED);
        bookingRepo.save(booking);

        log.info("Return recorded: booking={} disputeWindowEnds={}",
            booking.getId(), disputeWindowEnds);
    }

    /**
     * Dispute window has expired with no dispute raised.
     * Posts the full escrow split and marks booking COMPLETED.
     * PayoutEngine will pick this up and schedule the RazorpayX transfer.
     *
     * @param ownerAnnualRunning  owner's YTD payout total (for TDS threshold check)
     */
    @Transactional
    public void scheduleForPayout(Booking booking, BigDecimal ownerAnnualRunning) {
        if (booking.getBookingStatus() != BookingStatus.RETURNED)
            throw new InvalidStateTransitionException(
                booking.getBookingStatus(), BookingStatus.COMPLETED, "Booking"
            );

        if (booking.getDisputeWindowEndsAt() != null
            && Instant.now().isBefore(booking.getDisputeWindowEndsAt())) {
            throw new BusinessException(
                "Dispute window has not expired yet for booking: " + booking.getId(),
                "DISPUTE_WINDOW_ACTIVE"
            );
        }

        // Verify ledger has received the full rental amount before splitting
        BigDecimal escrowBalance = ledger.netBalance(
            booking.getId(), LedgerAccount.RENTER_ESCROW
        );
        BigDecimal expectedEscrow = booking.getAdvanceAmount()
            .add(booking.getRemainingAmount())
            .setScale(2, RoundingMode.HALF_UP);

        if (escrowBalance.compareTo(expectedEscrow) != 0) {
            throw new BusinessException(
                String.format(
                    "Escrow balance ₹%.2f does not match expected ₹%.2f for booking %s",
                    escrowBalance, expectedEscrow, booking.getId()
                ),
                "ESCROW_BALANCE_MISMATCH"
            );
        }

        // Recompute taxes from the actual rental amount
        BigDecimal base        = booking.getAdvanceAmount().add(booking.getRemainingAmount())
                                        .subtract(booking.getGstAmount())
                                        .subtract(booking.getPlatformFee())
                                        .setScale(2, RoundingMode.HALF_UP);
        BigDecimal platformFee = booking.getPlatformFee();
        BigDecimal tcsAmount   = PricingCalculator.tcs(base.add(booking.getGstAmount()));
        BigDecimal depositBal  = ledger.netBalance(booking.getId(), LedgerAccount.SECURITY_HOLD);
        BigDecimal ownerGross  = base.add(depositBal);
        BigDecimal tdsAmount   = PricingCalculator.tds(ownerGross, ownerAnnualRunning);

        // Post the full split in one atomic transaction
        ledger.postPayoutSplit(
            booking.getId(),
            base,
            platformFee,
            tcsAmount,
            tdsAmount,
            depositBal
        );

        booking.setBookingStatus(BookingStatus.COMPLETED);
        booking.setEscrowStatus(EscrowStatus.READY_FOR_PAYOUT);
        bookingRepo.save(booking);

        log.info("Payout split posted and booking COMPLETED: booking={} base=₹{} tds=₹{}",
            booking.getId(), base, tdsAmount);
    }

    /**
     * Freeze escrow when a dispute is raised.
     * Called immediately by DisputeService.openDispute() before saving the Dispute.
     */
    @Transactional
    public void holdForDispute(Booking booking) {
        if (booking.getBookingStatus() != BookingStatus.RETURNED
            && booking.getBookingStatus() != BookingStatus.IN_USE)
            throw new InvalidStateTransitionException(
                booking.getBookingStatus(), BookingStatus.DISPUTED, "Booking"
            );

        booking.setBookingStatus(BookingStatus.DISPUTED);
        booking.setEscrowStatus(EscrowStatus.ON_HOLD);
        bookingRepo.save(booking);

        log.info("Escrow frozen for dispute: booking={}", booking.getId());
    }

    /**
     * Full refund to renter — dispute resolved in renter's favour.
     *
     * @param refundAmount  total amount to refund (advance + remaining + deposit)
     * @param reason        reason for audit trail
     * @param rpRefundId    Razorpay refund ID from PG
     */
    @Transactional
    public void processFullRefund(
        Booking booking,
        BigDecimal refundAmount,
        String reason,
        String rpRefundId
    ) {
        guardEscrowStatus(booking, EscrowStatus.ON_HOLD, EscrowStatus.REFUNDED);

        ledger.postRefund(booking.getId(), refundAmount, reason, rpRefundId);

        booking.setEscrowStatus(EscrowStatus.REFUNDED);
        booking.setBookingStatus(BookingStatus.CANCELLED);
        bookingRepo.save(booking);

        log.info("Full refund processed: booking={} amount=₹{} rpRefund={}",
            booking.getId(), refundAmount, rpRefundId);
    }

    /**
     * Partial split — dispute resolved with a split decision.
     * Owner receives ownerAmount; renter is refunded renterAmount.
     * ownerAmount + renterAmount must equal total escrow held (enforced here).
     *
     * @param ownerAmount   amount to release to owner (goes to READY_FOR_PAYOUT)
     * @param renterAmount  amount to refund to renter
     * @param rpRefundId    Razorpay refund ID for the renter's portion
     * @param ownerAnnualRunning  owner YTD for TDS calculation
     */
    @Transactional
    public void processSplitResolution(
        Booking booking,
        BigDecimal ownerAmount,
        BigDecimal renterAmount,
        String rpRefundId,
        BigDecimal ownerAnnualRunning
    ) {
        guardEscrowStatus(booking, EscrowStatus.ON_HOLD, EscrowStatus.PARTIAL_RELEASED);

        // Verify the split doesn't exceed the available escrow
        BigDecimal escrowBalance  = ledger.netBalance(booking.getId(), LedgerAccount.RENTER_ESCROW);
        BigDecimal securityBal    = ledger.netBalance(booking.getId(), LedgerAccount.SECURITY_HOLD);
        BigDecimal totalAvailable = escrowBalance.add(securityBal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal splitTotal     = ownerAmount.add(renterAmount).setScale(2, RoundingMode.HALF_UP);

        if (splitTotal.compareTo(totalAvailable) > 0) {
            throw new BusinessException(
                String.format(
                    "Split total ₹%.2f exceeds available escrow ₹%.2f for booking %s",
                    splitTotal, totalAvailable, booking.getId()
                ),
                "SPLIT_EXCEEDS_ESCROW"
            );
        }

        // Refund renter's portion
        if (renterAmount.compareTo(BigDecimal.ZERO) > 0) {
            ledger.postRefund(booking.getId(), renterAmount,
                "Dispute split: renter refund portion", rpRefundId);
        }

        // Allocate owner's portion — use same split logic as clean payout
        if (ownerAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal tdsAmount = PricingCalculator.tds(ownerAmount, ownerAnnualRunning);
            ledger.post(booking.getId(), null,
                LedgerAccount.RENTER_ESCROW, LedgerAccount.OWNER_ESCROW,
                ownerAmount, "Dispute split: owner allocation");

            if (tdsAmount.compareTo(BigDecimal.ZERO) > 0) {
                ledger.post(booking.getId(), null,
                    LedgerAccount.OWNER_ESCROW, LedgerAccount.TAX_TDS,
                    tdsAmount, "TDS withheld on dispute split payout");
            }
        }

        booking.setEscrowStatus(EscrowStatus.PARTIAL_RELEASED);
        booking.setBookingStatus(BookingStatus.COMPLETED);
        bookingRepo.save(booking);

        log.info("Split resolution posted: booking={} owner=₹{} renter=₹{}",
            booking.getId(), ownerAmount, renterAmount);
    }

    /**
     * Dispute rejected — no valid grounds found.
     * Normal payout proceeds; dispute window is considered expired.
     *
     * @param ownerAnnualRunning  owner YTD for TDS calculation
     */
    @Transactional
    public void resolveDisputeRejected(Booking booking, BigDecimal ownerAnnualRunning) {
        guardEscrowStatus(booking, EscrowStatus.ON_HOLD, EscrowStatus.READY_FOR_PAYOUT);

        // Unfreeze and route to normal payout flow
        booking.setBookingStatus(BookingStatus.RETURNED);
        booking.setEscrowStatus(EscrowStatus.FULL_HELD);
        // Nullify dispute window so scheduleForPayout() doesn't re-check it
        booking.setDisputeWindowEndsAt(Instant.EPOCH);
        bookingRepo.save(booking);

        // Re-use the clean payout path
        scheduleForPayout(booking, ownerAnnualRunning);

        log.info("Dispute rejected — normal payout triggered: booking={}", booking.getId());
    }

    /**
     * No-show cancellation — renter did not arrive at handover.
     * Advance is forfeited to owner (platform keeps fee); deposit refunded.
     *
     * Forfeit policy (Phase 1):
     *   Owner receives: advance - platform_fee
     *   Renter receives: deposit back
     */
    @Transactional
    public void processNoShow(Booking booking, BigDecimal ownerAnnualRunning) {
        if (booking.getBookingStatus() != BookingStatus.CONFIRMED)
            throw new InvalidStateTransitionException(
                booking.getBookingStatus(), BookingStatus.NO_SHOW, "Booking"
            );

        BigDecimal advance    = booking.getAdvanceAmount();
        BigDecimal fee        = booking.getPlatformFee();
        BigDecimal ownerShare = advance.subtract(fee).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deposit    = ledger.netBalance(booking.getId(), LedgerAccount.SECURITY_HOLD);

        if (ownerShare.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal tds = PricingCalculator.tds(ownerShare, ownerAnnualRunning);
            ledger.post(booking.getId(), null,
                LedgerAccount.RENTER_ESCROW, LedgerAccount.OWNER_ESCROW,
                ownerShare, "No-show forfeit: advance allocated to owner");
            if (tds.compareTo(BigDecimal.ZERO) > 0) {
                ledger.post(booking.getId(), null,
                    LedgerAccount.OWNER_ESCROW, LedgerAccount.TAX_TDS,
                    tds, "TDS withheld on no-show forfeit");
            }
        }

        ledger.post(booking.getId(), null,
            LedgerAccount.RENTER_ESCROW, LedgerAccount.PLATFORM_FEE,
            fee, "No-show: platform fee retained");

        if (deposit.compareTo(BigDecimal.ZERO) > 0) {
            ledger.post(booking.getId(), null,
                LedgerAccount.SECURITY_HOLD, LedgerAccount.BANK_SETTLEMENT,
                deposit, "No-show: security deposit returned to renter");
        }

        booking.setBookingStatus(BookingStatus.NO_SHOW);
        booking.setEscrowStatus(EscrowStatus.PARTIAL_RELEASED);
        bookingRepo.save(booking);

        log.info("No-show processed: booking={} ownerShare=₹{}", booking.getId(), ownerShare);
    }

    // ── Guards ────────────────────────────────────────────────────────────────

    /**
     * Assert that the booking is in the expected status.
     * Throws InvalidStateTransitionException (HTTP 409) if not.
     */
    private void guardBookingStatus(
        Booking booking,
        BookingStatus expected,
        BookingStatus requested
    ) {
        if (booking.getBookingStatus() != expected)
            throw new InvalidStateTransitionException(
                booking.getBookingStatus(), requested, "Booking"
            );
    }

    /**
     * Assert that the escrow is in the expected status.
     * Throws InvalidStateTransitionException (HTTP 409) if not.
     */
    private void guardEscrowStatus(
        Booking booking,
        EscrowStatus expected,
        EscrowStatus requested
    ) {
        if (booking.getEscrowStatus() != expected)
            throw new InvalidStateTransitionException(
                booking.getEscrowStatus(), requested, "Escrow"
            );
    }
}
