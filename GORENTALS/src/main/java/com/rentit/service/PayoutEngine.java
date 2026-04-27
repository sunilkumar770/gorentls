package com.rentit.service;

import com.rentit.model.Booking;
import com.rentit.model.OwnerPayoutAccount;
import com.rentit.model.Payout;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.model.enums.PayoutOnboardingStatus;
import com.rentit.model.enums.PayoutStatus;
import com.rentit.pricing.PricingCalculator;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.OwnerPayoutAccountRepository;
import com.rentit.repository.PayoutRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Scheduled payout execution engine.
 *
 * Two scheduled jobs:
 *
 *  1. processExpiredDisputeWindows()  — every 15 minutes
 *     Finds bookings in RETURNED status whose dispute window has expired,
 *     posts the ledger split, creates a Payout record at T+2, and marks
 *     booking COMPLETED + READY_FOR_PAYOUT.
 *
 *  2. executePendingPayouts()  — every 15 minutes (offset by 5 min)
 *     Finds Payout records in PENDING status that have passed scheduledAt,
 *     calls RazorpayX to initiate the transfer, and marks payout INITIATED.
 */
@Component
public class PayoutEngine {

    private static final Logger log = LoggerFactory.getLogger(PayoutEngine.class);

    private static final int MAX_RETRY_ATTEMPTS = 3;

    private final BookingRepository            bookingRepo;
    private final PayoutRepository             payoutRepo;
    private final OwnerPayoutAccountRepository ownerAccountRepo;
    private final BookingEscrowService         escrowService;
    private final RazorpayIntegrationService   razorpay;
    private final LedgerService                ledger;

    public PayoutEngine(
        BookingRepository            bookingRepo,
        PayoutRepository             payoutRepo,
        OwnerPayoutAccountRepository ownerAccountRepo,
        BookingEscrowService         escrowService,
        RazorpayIntegrationService   razorpay,
        LedgerService                ledger
    ) {
        this.bookingRepo      = bookingRepo;
        this.payoutRepo       = payoutRepo;
        this.ownerAccountRepo = ownerAccountRepo;
        this.escrowService    = escrowService;
        this.razorpay         = razorpay;
        this.ledger           = ledger;
    }

    // ── Job 1: Expire dispute windows and schedule payouts ────────────────────

    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 60 * 1000)
    @SchedulerLock(name = "PayoutEngine_processExpiredDisputeWindows",
                   lockAtLeastFor = "PT14M", lockAtMostFor = "PT14M")
    public void processExpiredDisputeWindows() {
        Instant now = Instant.now();
        log.info("PayoutEngine: scanning for expired dispute windows at {}", now);

        List<Booking> readyBookings = bookingRepo
            .findByBookingStatusAndDisputeWindowEndsAtBefore(com.rentit.model.enums.BookingStatus.RETURNED, now);

        log.info("PayoutEngine: found {} bookings ready for payout", readyBookings.size());

        for (Booking booking : readyBookings) {
            try {
                processOneBookingForPayout(booking);
            } catch (Exception e) {
                log.error("PayoutEngine: error processing booking={} error={}",
                    booking.getId(), e.getMessage(), e);
            }
        }
    }

    @Transactional
    protected void processOneBookingForPayout(Booking booking) {
        if (booking.getEscrowStatus() == EscrowStatus.READY_FOR_PAYOUT
            || booking.getEscrowStatus() == EscrowStatus.PAID_OUT) {
            log.debug("PayoutEngine: booking={} already processed, skipping", booking.getId());
            return;
        }

        if (payoutRepo.existsByBookingId(booking.getId())) {
            log.debug("PayoutEngine: payout record already exists for booking={}", booking.getId());
            return;
        }

        UUID ownerId = booking.getListing().getOwner().getId();

        Optional<OwnerPayoutAccount> accountOpt = ownerAccountRepo
            .findByOwnerIdAndStatus(ownerId, PayoutOnboardingStatus.VERIFIED);

        if (accountOpt.isEmpty()) {
            log.warn("PayoutEngine: owner={} has no verified payout account — holding booking={}",
                ownerId, booking.getId());
            return;
        }

        OwnerPayoutAccount account = accountOpt.get();
        BigDecimal ownerAnnualRunning = ownerYtdPayouts(ownerId);

        escrowService.scheduleForPayout(booking, ownerAnnualRunning);

        BigDecimal ownerEscrowBalance = ledger.netBalance(
            booking.getId(),
            com.rentit.model.enums.LedgerAccount.OWNER_ESCROW
        );

        if (ownerEscrowBalance.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("PayoutEngine: owner escrow balance is zero for booking={}, no payout created",
                booking.getId());
            return;
        }

        BigDecimal grossAmount = booking.getAdvanceAmount()
            .add(booking.getRemainingAmount())
            .subtract(booking.getPlatformFee())
            .subtract(booking.getGstAmount())
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal tdsAmount  = PricingCalculator.tds(grossAmount, ownerAnnualRunning);
        BigDecimal netAmount  = ownerEscrowBalance;

        Payout payout = new Payout(
            booking.getId(),
            ownerId,
            grossAmount,
            tdsAmount,
            netAmount,
            account.getFundAccountId()
        );
        payoutRepo.save(payout);

        log.info("PayoutEngine: payout record created payoutId={} bookingId={} net=₹{} scheduledAt={}",
            payout.getId(), booking.getId(), netAmount, payout.getScheduledAt());
    }

    // ── Job 2: Execute pending payouts via RazorpayX ──────────────────────────

    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 5 * 60 * 1000)
    @SchedulerLock(name = "PayoutEngine_executePendingPayouts",
                   lockAtLeastFor = "PT14M", lockAtMostFor = "PT14M")
    public void executePendingPayouts() {
        Instant now = Instant.now();
        log.info("PayoutEngine: executing due payouts at {}", now);

        List<Payout> duePending = payoutRepo.findDueForExecution(now);
        log.info("PayoutEngine: {} payouts due for execution", duePending.size());

        for (Payout payout : duePending) {
            try {
                executeOnePayout(payout);
            } catch (Exception e) {
                log.error("PayoutEngine: error executing payoutId={} error={}",
                    payout.getId(), e.getMessage(), e);
            }
        }

        List<Payout> failedForRetry = payoutRepo.findFailedForRetry(
            now.minusSeconds(30 * 60)
        );
        log.info("PayoutEngine: {} failed payouts eligible for retry", failedForRetry.size());

        for (Payout payout : failedForRetry) {
            try {
                executeOnePayout(payout);
            } catch (Exception e) {
                log.error("PayoutEngine: retry failed for payoutId={} error={}",
                    payout.getId(), e.getMessage(), e);
            }
        }
    }

    @Transactional
    protected void executeOnePayout(Payout payout) {
        if (payout.getStatus() == PayoutStatus.INITIATED
            || payout.getStatus() == PayoutStatus.SUCCESS) {
            log.debug("PayoutEngine: payoutId={} already {} — skipping",
                payout.getId(), payout.getStatus());
            return;
        }

        if (payout.getStatus() == PayoutStatus.ON_HOLD) {
            log.info("PayoutEngine: payoutId={} is ON_HOLD — skipping until cleared",
                payout.getId());
            return;
        }

        OwnerPayoutAccount account = ownerAccountRepo
            .findByFundAccountId(payout.getFundAccountId())
            .orElseThrow(() -> new IllegalStateException(
                "Fund account not found for payout: " + payout.getId()));

        if (!account.isVerified()) {
            payout.markFailed("Owner payout account is no longer verified: " + account.getStatus());
            payoutRepo.save(payout);
            log.warn("PayoutEngine: payoutId={} failed — account not verified", payout.getId());
            return;
        }

        boolean isUpi = "UPI".equalsIgnoreCase(account.getAccountType());
        String narration = "GoRentals " + payout.getBookingId().toString().substring(0, 8);

        try {
            String rpPayoutId = razorpay.initiatePayout(
                payout.getFundAccountId(),
                payout.getNetAmount(),
                payout.getId().toString(),
                narration,
                isUpi
            );

            payout.markInitiated(rpPayoutId);
            payoutRepo.save(payout);

            ledger.postPayoutTransfer(payout.getBookingId(), payout.getNetAmount(), rpPayoutId);

            log.info("PayoutEngine: payout INITIATED payoutId={} rpPayoutId={} net=₹{}",
                payout.getId(), rpPayoutId, payout.getNetAmount());

        } catch (RuntimeException e) {
            payout.markFailed(truncate(e.getMessage(), 255));
            payoutRepo.save(payout);
            log.error("PayoutEngine: payout FAILED payoutId={} error={}",
                payout.getId(), e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal ownerYtdPayouts(UUID ownerId) {
        Instant financialYearStart = currentFinancialYearStart();
        try {
            return payoutRepo.sumSuccessfulPayoutsForOwnerInYear(ownerId, financialYearStart)
                             .setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            log.warn("Could not compute YTD payouts for owner={}, defaulting to 0: {}",
                ownerId, e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private Instant currentFinancialYearStart() {
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(
            java.time.ZoneId.of("Asia/Kolkata")
        );
        int year = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
        return java.time.LocalDate.of(year, 4, 1)
            .atStartOfDay(java.time.ZoneId.of("Asia/Kolkata"))
            .toInstant();
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "Unknown error";
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
