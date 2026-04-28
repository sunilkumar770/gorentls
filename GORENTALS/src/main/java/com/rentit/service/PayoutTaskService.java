package com.rentit.service;

import com.rentit.model.Booking;
import com.rentit.model.OwnerPayoutAccount;
import com.rentit.model.Payout;
import com.rentit.model.enums.EscrowStatus;
import com.rentit.model.enums.PayoutOnboardingStatus;
import com.rentit.model.enums.PayoutStatus;
import com.rentit.pricing.PricingCalculator;
import com.rentit.repository.OwnerPayoutAccountRepository;
import com.rentit.repository.PayoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.UUID;

/**
 * Atomic transactional units for the PayoutEngine.
 * By moving these to a separate service, we ensure Spring's @Transactional 
 * proxy is active even when called from a loop in PayoutEngine.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayoutTaskService {

    private final PayoutRepository             payoutRepo;
    private final OwnerPayoutAccountRepository ownerAccountRepo;
    private final BookingEscrowService         escrowService;
    private final RazorpayIntegrationService   razorpay;
    private final LedgerService                ledger;

    @Transactional
    public void processOneBookingForPayout(Booking booking, BigDecimal ownerAnnualRunning) {
        if (booking.getEscrowStatus() == EscrowStatus.READY_FOR_PAYOUT
            || booking.getEscrowStatus() == EscrowStatus.PAID_OUT) {
            log.debug("[Task] booking={} already processed, skipping", booking.getId());
            return;
        }

        if (payoutRepo.existsByBookingId(booking.getId())) {
            log.debug("[Task] payout record already exists for booking={}", booking.getId());
            return;
        }

        UUID ownerId = booking.getListing().getOwner().getId();
        Optional<OwnerPayoutAccount> accountOpt = ownerAccountRepo
            .findByOwnerIdAndStatus(ownerId, PayoutOnboardingStatus.VERIFIED);

        if (accountOpt.isEmpty()) {
            log.warn("[Task] owner={} has no verified payout account — holding booking={}",
                ownerId, booking.getId());
            return;
        }

        OwnerPayoutAccount account = accountOpt.get();
        escrowService.scheduleForPayout(booking, ownerAnnualRunning);

        BigDecimal ownerEscrowBalance = ledger.netBalance(
            booking.getId(),
            com.rentit.model.enums.LedgerAccount.OWNER_ESCROW
        );

        if (ownerEscrowBalance.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("[Task] owner escrow balance is zero for booking={}, no payout created",
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

        log.info("[Task] Payout scheduled: payoutId={} bookingId={} net=₹{}",
            payout.getId(), booking.getId(), netAmount);
    }

    @Transactional
    public void executeOnePayout(Payout payout) {
        if (payout.getStatus() == PayoutStatus.INITIATED
            || payout.getStatus() == PayoutStatus.SUCCESS) {
            return;
        }

        if (payout.getStatus() == PayoutStatus.ON_HOLD) {
            return;
        }

        OwnerPayoutAccount account = ownerAccountRepo
            .findByFundAccountId(payout.getFundAccountId())
            .orElseThrow(() -> new IllegalStateException(
                "Fund account not found for payout: " + payout.getId()));

        if (!account.isVerified()) {
            payout.markFailed("Owner payout account is no longer verified: " + account.getStatus());
            payoutRepo.save(payout);
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

        } catch (Exception e) {
            payout.markFailed(truncate(e.getMessage(), 255));
            payoutRepo.save(payout);
            log.error("[Task] payout FAILED payoutId={} error={}", payout.getId(), e.getMessage());
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "Unknown error";
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
