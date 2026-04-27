package com.rentit.service;

import com.rentit.model.LedgerTransaction;
import com.rentit.model.enums.LedgerAccount;
import com.rentit.model.enums.LedgerDirection;
import com.rentit.repository.LedgerTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Double-entry internal ledger engine.
 *
 * INVARIANT: Every call to post() produces exactly one DEBIT + one CREDIT row
 * of identical amount. The net sum of all ledger entries for any booking
 * must always be zero.
 *
 * RULES:
 *   - This service is the ONLY place that writes LedgerTransaction rows.
 *   - Never write LedgerTransaction from BookingEscrowService or PayoutEngine directly.
 *   - Always call post() inside the same DB transaction as the state change that triggered it.
 *   - Ledger rows are immutable after creation — no updates, no deletes.
 *
 * Typical posting sequence for a clean rental:
 *
 *   1. Advance payment captured:
 *      DEBIT  BANK_SETTLEMENT  ₹X  (money arrived in our bank)
 *      CREDIT RENTER_ESCROW    ₹X  (allocated to renter's escrow bucket)
 *
 *   2. Deposit captured:
 *      DEBIT  BANK_SETTLEMENT  ₹D
 *      CREDIT SECURITY_HOLD    ₹D
 *
 *   3. Final payment captured:
 *      DEBIT  BANK_SETTLEMENT  ₹Y
 *      CREDIT RENTER_ESCROW    ₹Y
 *
 *   4. At payout time — split RENTER_ESCROW into buckets:
 *      DEBIT  RENTER_ESCROW    ₹(base)       → CREDIT OWNER_ESCROW   ₹(base)
 *      DEBIT  RENTER_ESCROW    ₹(fee)        → CREDIT PLATFORM_FEE   ₹(fee)
 *      DEBIT  RENTER_ESCROW    ₹(gst)        → CREDIT TAX_TCS        ₹(gst)
 *
 *   5. TDS withheld:
 *      DEBIT  OWNER_ESCROW     ₹(tds)        → CREDIT TAX_TDS        ₹(tds)
 *
 *   6. Net payout transferred:
 *      DEBIT  OWNER_ESCROW     ₹(net)        → CREDIT BANK_SETTLEMENT ₹(net)
 *
 *   7. Deposit returned:
 *      DEBIT  SECURITY_HOLD    ₹D            → CREDIT BANK_SETTLEMENT ₹D
 */
@Service
public class LedgerService {

    private static final Logger log = LoggerFactory.getLogger(LedgerService.class);

    private final LedgerTransactionRepository repo;

    public LedgerService(LedgerTransactionRepository repo) {
        this.repo = repo;
    }

    // ── Core posting ──────────────────────────────────────────────────────────

    /**
     * Post a balanced double-entry pair.
     *
     * MUST be called inside a @Transactional method. If the outer transaction
     * rolls back, both ledger rows are rolled back together — the ledger stays
     * consistent with the application state.
     *
     * @param bookingId  booking context (required)
     * @param paymentId  triggering PG payment ID (null for internal transfers)
     * @param debit      account that money is leaving
     * @param credit     account that money is entering
     * @param amount     must be > 0; rounded to 2dp HALF_UP before posting
     * @param reason     human-readable audit description (required, non-blank)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void post(
        UUID bookingId,
        UUID paymentId,
        LedgerAccount debit,
        LedgerAccount credit,
        BigDecimal amount,
        String reason
    ) {
        post(bookingId, paymentId, debit, credit, amount, reason, null);
    }

    /**
     * Post with structured metadata (e.g. razorpay_order_id, tds_pan_ref).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void post(
        UUID bookingId,
        UUID paymentId,
        LedgerAccount debit,
        LedgerAccount credit,
        BigDecimal amount,
        String reason,
        Map<String, Object> metadata
    ) {
        validatePostArgs(bookingId, debit, credit, amount, reason);

        BigDecimal scaled = amount.setScale(2, RoundingMode.HALF_UP);

        LedgerTransaction debitEntry = new LedgerTransaction(
            bookingId, paymentId, debit, LedgerDirection.DEBIT, scaled, reason, metadata
        );
        LedgerTransaction creditEntry = new LedgerTransaction(
            bookingId, paymentId, credit, LedgerDirection.CREDIT, scaled, reason, metadata
        );

        repo.save(debitEntry);
        repo.save(creditEntry);

        log.debug("Ledger posted: DEBIT {} / CREDIT {} = ₹{} | booking={} reason='{}'",
            debit, credit, scaled, bookingId, reason);
    }

    // ── Payout split posting ──────────────────────────────────────────────────

    /**
     * High-level helper — posts the full escrow split at payout time.
     *
     * Splits RENTER_ESCROW into:
     *   → OWNER_ESCROW   (base rental amount)
     *   → PLATFORM_FEE   (5% fee)
     *   → TAX_TCS        (1% TCS on net taxable)
     *
     * Then withholds TDS from OWNER_ESCROW → TAX_TDS.
     *
     * Called by BookingEscrowService.scheduleForPayout() after all validations pass.
     *
     * @param bookingId      booking being settled
     * @param baseAmount     rental base (goes to owner)
     * @param platformFee    5% platform cut
     * @param tcsAmount      1% TCS
     * @param tdsAmount      0.1% TDS (may be zero if below threshold)
     * @param depositAmount  security deposit being returned to renter
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void postPayoutSplit(
        UUID bookingId,
        BigDecimal baseAmount,
        BigDecimal platformFee,
        BigDecimal tcsAmount,
        BigDecimal tdsAmount,
        BigDecimal depositAmount
    ) {
        // 1. Allocate base to owner escrow
        post(bookingId, null,
            LedgerAccount.RENTER_ESCROW, LedgerAccount.OWNER_ESCROW,
            baseAmount, "Payout split: base rental allocated to owner");

        // 2. Deduct platform fee
        post(bookingId, null,
            LedgerAccount.RENTER_ESCROW, LedgerAccount.PLATFORM_FEE,
            platformFee, "Payout split: platform commission");

        // 3. Deduct TCS (platform collects from renter, remits to government)
        if (tcsAmount.compareTo(BigDecimal.ZERO) > 0) {
            post(bookingId, null,
                LedgerAccount.RENTER_ESCROW, LedgerAccount.TAX_TCS,
                tcsAmount, "TCS collected under CGST Section 52");
        }

        // 4. Withhold TDS from owner share (platform remits to government)
        if (tdsAmount.compareTo(BigDecimal.ZERO) > 0) {
            post(bookingId, null,
                LedgerAccount.OWNER_ESCROW, LedgerAccount.TAX_TDS,
                tdsAmount, "TDS withheld under Section 194-O");
        }

        // 5. Release security deposit back to renter (bank settlement)
        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
            post(bookingId, null,
                LedgerAccount.SECURITY_HOLD, LedgerAccount.BANK_SETTLEMENT,
                depositAmount, "Security deposit refunded to renter");
        }

        log.info("Payout split posted for booking={}: base={}, fee={}, tcs={}, tds={}, deposit={}",
            bookingId, baseAmount, platformFee, tcsAmount, tdsAmount, depositAmount);
    }

    /**
     * Posts the net payout transfer — money leaving OWNER_ESCROW to bank.
     * Called AFTER RazorpayX Payouts API confirms the transfer was initiated.
     *
     * @param bookingId booking being settled
     * @param netAmount gross - tds (what actually leaves the platform)
     * @param rpPayoutId RazorpayX payout ID for audit trail
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void postPayoutTransfer(
        UUID bookingId,
        BigDecimal netAmount,
        String rpPayoutId
    ) {
        Map<String, Object> meta = Map.of("rp_payout_id", rpPayoutId);
        post(bookingId, null,
            LedgerAccount.OWNER_ESCROW, LedgerAccount.BANK_SETTLEMENT,
            netAmount, "Net payout transferred to owner bank/UPI", meta);

        log.info("Payout transfer posted: booking={} net=₹{} rp_payout={}",
            bookingId, netAmount, rpPayoutId);
    }

    // ── Refund posting ────────────────────────────────────────────────────────

    /**
     * Post a refund from escrow back to renter via Razorpay refund.
     *
     * @param bookingId    booking being refunded
     * @param refundAmount amount being returned to renter
     * @param reason       refund reason for audit trail
     * @param rpRefundId   Razorpay refund ID
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void postRefund(
        UUID bookingId,
        BigDecimal refundAmount,
        String reason,
        String rpRefundId
    ) {
        Map<String, Object> meta = Map.of("rp_refund_id", rpRefundId);
        post(bookingId, null,
            LedgerAccount.RENTER_ESCROW, LedgerAccount.BANK_SETTLEMENT,
            refundAmount, "Refund to renter: " + reason, meta);

        log.info("Refund posted: booking={} amount=₹{} rp_refund={} reason='{}'",
            bookingId, refundAmount, rpRefundId, reason);
    }

    // ── Balance queries ───────────────────────────────────────────────────────

    /**
     * Net balance of an account for a booking.
     * Net = SUM(CREDIT) - SUM(DEBIT).
     * Positive = money available in that account.
     */
    @Transactional(readOnly = true)
    public BigDecimal netBalance(UUID bookingId, LedgerAccount account) {
        BigDecimal credits = repo.sumByBookingAndAccountAndDirection(
            bookingId, account, LedgerDirection.CREDIT);
        BigDecimal debits  = repo.sumByBookingAndAccountAndDirection(
            bookingId, account, LedgerDirection.DEBIT);
        return credits.subtract(debits).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Full ledger history for a booking — used in admin dispute/audit views.
     */
    @Transactional(readOnly = true)
    public List<LedgerTransaction> historyFor(UUID bookingId) {
        return repo.findByBookingIdOrderByCreatedAtAsc(bookingId);
    }

    /**
     * Platform revenue report — total PLATFORM_FEE credits in a date range.
     */
    @Transactional(readOnly = true)
    public BigDecimal platformFeeRevenue(Instant from, Instant to) {
        return repo.totalPlatformFeeRevenue(from, to)
                   .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * TDS report — total TDS withheld in a date range.
     * Used for quarterly TDS filing (26Q / 26QAA).
     */
    @Transactional(readOnly = true)
    public BigDecimal tdsWithheld(Instant from, Instant to) {
        return repo.totalTdsWithheld(from, to)
                   .setScale(2, RoundingMode.HALF_UP);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    private void validatePostArgs(
        UUID bookingId,
        LedgerAccount debit,
        LedgerAccount credit,
        BigDecimal amount,
        String reason
    ) {
        if (bookingId == null)
            throw new IllegalArgumentException("bookingId is required for ledger posting");
        if (debit == null || credit == null)
            throw new IllegalArgumentException("Both debit and credit accounts are required");
        if (debit == credit)
            throw new IllegalArgumentException(
                "Debit and credit accounts must differ — got: " + debit);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException(
                "Ledger amount must be positive, got: " + amount);
        if (reason == null || reason.isBlank())
            throw new IllegalArgumentException("Ledger reason is required for audit trail");
    }
}
