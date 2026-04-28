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
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
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
    private final PayoutTaskService            payoutTaskService;
    private final Counter payoutsInitiatedCounter;
    private final Counter payoutsFailedCounter;
    private final Counter payoutsSucceededCounter;

    public PayoutEngine(
        BookingRepository            bookingRepo,
        PayoutRepository             payoutRepo,
        OwnerPayoutAccountRepository ownerAccountRepo,
        PayoutTaskService            payoutTaskService,
        MeterRegistry                meterRegistry
    ) {
        this.bookingRepo      = bookingRepo;
        this.payoutRepo       = payoutRepo;
        this.ownerAccountRepo = ownerAccountRepo;
        this.payoutTaskService = payoutTaskService;

        this.payoutsInitiatedCounter = Counter.builder("payouts.initiated")
            .register(meterRegistry);
        this.payoutsFailedCounter = Counter.builder("payouts.failed")
            .register(meterRegistry);
        this.payoutsSucceededCounter = Counter.builder("payouts.succeeded")
            .register(meterRegistry);
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
                BigDecimal annualRunning = ownerYtdPayouts(booking.getListing().getOwner().getId());
                payoutTaskService.processOneBookingForPayout(booking, annualRunning);
                payoutsInitiatedCounter.increment();
            } catch (Exception e) {
                log.error("PayoutEngine: error processing booking={} error={}",
                    booking.getId(), e.getMessage(), e);
            }
        }
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
                payoutTaskService.executeOnePayout(payout);
                payoutsSucceededCounter.increment();
            } catch (Exception e) {
                payoutsFailedCounter.increment();
                log.error("PayoutEngine: error executing payoutId={} error={}",
                    payout.getId(), e.getMessage(), e);
            }
        }

        List<Payout> failedForRetry = payoutRepo.findFailedForRetry(
            now.minusSeconds(30 * 60)
        );
        for (Payout payout : failedForRetry) {
            try {
                payoutTaskService.executeOnePayout(payout);
                payoutsSucceededCounter.increment();
            } catch (Exception e) {
                payoutsFailedCounter.increment();
                log.error("PayoutEngine: retry failed for payoutId={} error={}",
                    payout.getId(), e.getMessage(), e);
            }
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
