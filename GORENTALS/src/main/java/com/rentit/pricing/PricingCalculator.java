package com.rentit.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Single source of truth for all rental pricing arithmetic.
 *
 * RULES:
 *   - Pure static utility — zero Spring dependencies, fully unit-testable.
 *   - All results rounded to 2dp HALF_UP (matches Indian banking standard).
 *   - All rates are named constants — never hardcode rates in service layer.
 *   - No I/O, no side effects, no external calls.
 *
 * Phase 1 rates (MVP — Hyderabad market):
 *   GST              18%    on base rental (SAC 997319 – equipment rental)
 *   Platform fee      5%    on base rental (GoRentals commission)
 *   Owner commission  0%    (waived in Phase 1 to accelerate supply)
 *   TDS (194-O)      0.1%   on owner gross payout; zero below ₹5L annual threshold
 *   TCS (Sec 52)     1%     on net taxable value collected from renter
 *   Advance split   30%     of (rental subtotal + deposit) at booking time
 *   Remaining       70%     collected at handover
 *
 * Phase 2 additions (not implemented here, noted for reference):
 *   Late fee penalty = 1.5× daily rate per day overdue
 *   Damage deduction = admin-defined amount subtracted from security deposit
 */
public final class PricingCalculator {

    // ── Rate constants ────────────────────────────────────────────────────────

    public static final BigDecimal GST_RATE          = new BigDecimal("0.18");
    public static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.05");
    public static final BigDecimal TDS_RATE          = new BigDecimal("0.001");   // 0.1%
    public static final BigDecimal TCS_RATE          = new BigDecimal("0.01");    // 1.0%

    /** Annual owner earnings threshold below which TDS is not deducted (Section 194-O). */
    public static final BigDecimal TDS_THRESHOLD     = new BigDecimal("500000");  // ₹5,00,000

    /** Default advance fraction (30%). Can be overridden per listing category. */
    public static final BigDecimal DEFAULT_ADVANCE_PCT = new BigDecimal("0.30");

    private PricingCalculator() { /* static utility — no instantiation */ }

    // ── Core quote ────────────────────────────────────────────────────────────

    /**
     * Immutable value object holding the full price breakdown for a booking.
     *
     * Invariants:
     *   advanceAmount + remainingAmount == totalAmount
     *   gstAmount  == base * GST_RATE
     *   platformFee == base * PLATFORM_FEE_RATE
     *   totalAmount == base + gstAmount + platformFee + deposit
     *   ownerPayout == base + deposit  (Phase 1: zero commission)
     *
     * @param base            rental price before any taxes or fees
     * @param gstAmount       18% GST on base
     * @param platformFee     5% platform commission on base
     * @param deposit         refundable security deposit (not taxed)
     * @param advanceAmount   amount due NOW at booking (30% of subtotal + full deposit)
     * @param remainingAmount amount due at handover (70% of subtotal)
     * @param totalAmount     base + gst + fee + deposit
     * @param ownerPayout     what the owner receives = base + deposit (Phase 1)
     */
    public record Phase1Quote(
        BigDecimal base,
        BigDecimal gstAmount,
        BigDecimal platformFee,
        BigDecimal deposit,
        BigDecimal advanceAmount,
        BigDecimal remainingAmount,
        BigDecimal totalAmount,
        BigDecimal ownerPayout
    ) {
        /**
         * Sanity check — verifies internal consistency of the quote.
         * Call in unit tests and optionally in BookingService.createBooking().
         */
        public boolean isBalanced() {
            BigDecimal expectedTotal = base
                .add(gstAmount)
                .add(platformFee)
                .add(deposit)
                .setScale(2, RoundingMode.HALF_UP);

            BigDecimal expectedSplit = advanceAmount
                .add(remainingAmount)
                .setScale(2, RoundingMode.HALF_UP);

            return expectedTotal.compareTo(totalAmount) == 0
                && expectedSplit.compareTo(totalAmount) == 0;
        }

        /** Formatted summary for logging — never use in UI display. */
        @Override
        public String toString() {
            return String.format(
                "Phase1Quote{base=%.2f, gst=%.2f, fee=%.2f, deposit=%.2f, " +
                "advance=%.2f, remaining=%.2f, total=%.2f, ownerPayout=%.2f}",
                base, gstAmount, platformFee, deposit,
                advanceAmount, remainingAmount, totalAmount, ownerPayout
            );
        }
    }

    /**
     * Generate a full price quote for a booking.
     *
     * @param pricePerDay  listing's daily price in INR (must be > 0)
     * @param days         number of rental days (must be >= 1)
     * @param deposit      refundable security deposit in INR (>= 0)
     * @param advancePct   fraction to collect upfront e.g. 0.30 = 30%
     *                     clamped to [0.0, 1.0]; use 1.0 for full upfront payment
     */
    public static Phase1Quote quote(
        BigDecimal pricePerDay,
        long days,
        BigDecimal deposit,
        BigDecimal advancePct
    ) {
        if (pricePerDay == null || pricePerDay.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("pricePerDay must be positive");
        if (days < 1)
            throw new IllegalArgumentException("days must be >= 1");

        BigDecimal dep       = nonNegative(deposit);
        BigDecimal aPct      = clamp(advancePct, BigDecimal.ZERO, BigDecimal.ONE);

        BigDecimal base      = scale(pricePerDay.multiply(BigDecimal.valueOf(days)));
        BigDecimal gst       = scale(base.multiply(GST_RATE));
        BigDecimal fee       = scale(base.multiply(PLATFORM_FEE_RATE));
        BigDecimal subtotal  = scale(base.add(gst).add(fee));      // rental cost before deposit
        BigDecimal total     = scale(subtotal.add(dep));

        // Deposit always collected upfront in full;
        // advance percentage applies only to the rental subtotal.
        BigDecimal advance   = scale(subtotal.multiply(aPct)).add(dep);
        BigDecimal remaining = scale(total.subtract(advance));

        // Phase 1: owner receives base + deposit (0% commission waived)
        BigDecimal ownerPayout = scale(base.add(dep));

        return new Phase1Quote(base, gst, fee, dep, advance, remaining, total, ownerPayout);
    }

    /**
     * Convenience overload — uses DEFAULT_ADVANCE_PCT (30%).
     */
    public static Phase1Quote quote(
        BigDecimal pricePerDay,
        long days,
        BigDecimal deposit
    ) {
        return quote(pricePerDay, days, deposit, DEFAULT_ADVANCE_PCT);
    }

    // ── Tax helpers ───────────────────────────────────────────────────────────

    /**
     * Compute TDS to withhold from owner payout under Section 194-O.
     *
     * Returns ZERO if the owner's running annual payout total is below the
     * ₹5 lakh threshold at the time of this payout.
     *
     * @param ownerGrossPayout       gross amount about to be paid out for THIS booking
     * @param ownerAnnualRunningTotal total payouts already made to this owner
     *                                in the current financial year (EXCLUDING this one)
     */
    public static BigDecimal tds(
        BigDecimal ownerGrossPayout,
        BigDecimal ownerAnnualRunningTotal
    ) {
        BigDecimal ytd = nonNegative(ownerAnnualRunningTotal);
        BigDecimal gross = nonNegative(ownerGrossPayout);
        BigDecimal newTotal = ytd.add(gross);
        
        if (newTotal.compareTo(TDS_THRESHOLD) <= 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal taxableAmount;
        if (ytd.compareTo(TDS_THRESHOLD) >= 0) {
            taxableAmount = gross;
        } else {
            taxableAmount = newTotal.subtract(TDS_THRESHOLD);
        }
        
        return scale(taxableAmount.multiply(TDS_RATE));
    }

    /**
     * Compute TCS on the net taxable rental value collected from the renter.
     * TCS is collected by the platform and remitted to the government.
     *
     * @param netTaxableValue  rental amount excluding deposit (base + GST)
     */
    public static BigDecimal tcs(BigDecimal netTaxableValue) {
        return scale(nonNegative(netTaxableValue).multiply(TCS_RATE));
    }

    /**
     * Late return penalty for a given number of overdue days.
     * Rate: 1.5× the original daily price per overdue day.
     * Used in Phase 2 — included here to keep pricing logic co-located.
     */
    public static BigDecimal latePenalty(BigDecimal pricePerDay, long overdueDays) {
        if (overdueDays <= 0) return BigDecimal.ZERO;
        BigDecimal rate = pricePerDay.multiply(new BigDecimal("1.5"));
        return scale(rate.multiply(BigDecimal.valueOf(overdueDays)));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static BigDecimal scale(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nonNegative(BigDecimal v) {
        return (v == null || v.compareTo(BigDecimal.ZERO) < 0) ? BigDecimal.ZERO : v;
    }

    private static BigDecimal clamp(BigDecimal v, BigDecimal min, BigDecimal max) {
        if (v == null) return min;
        return v.max(min).min(max);
    }
}
