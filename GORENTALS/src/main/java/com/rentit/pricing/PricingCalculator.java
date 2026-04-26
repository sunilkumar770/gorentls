package com.rentit.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * GoRentals Pricing Engine — mirrors src/lib/pricing.ts exactly.
 *
 * SINGLE source of truth for all pricing on the backend.
 * BookingService delegates here exclusively — never inline percentages.
 * Pure static utility — no Spring dependencies, fully unit-testable.
 *
 * Phase 1 (0-3 months):
 *   GST          = 18% of rentalAmount
 *   Platform fee = 5%  of rentalAmount
 *   ownerPayout  = rentalAmount + securityDeposit (0% commission)
 *   totalAmount  = rental + GST + fee + deposit
 *
 * Phase 2 (future): use calcPhase2() — configurable userFeePct / ownerFeePct.
 */
public final class PricingCalculator {

    public static final BigDecimal GST_RATE          = new BigDecimal("0.18");
    public static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.05");
    public static final BigDecimal OWNER_COMMISSION  = BigDecimal.ZERO;

    private PricingCalculator() {}

    // ── Phase 1 ───────────────────────────────────────────────────────────────

    public static final class Phase1Quote {
        public final BigDecimal base;
        public final BigDecimal gstAmount;
        public final BigDecimal platformFee;
        public final BigDecimal deposit;
        public final BigDecimal totalAmount;
        public final BigDecimal ownerPayout;

        private Phase1Quote(BigDecimal base, BigDecimal gstAmount,
                            BigDecimal platformFee, BigDecimal deposit,
                            BigDecimal totalAmount, BigDecimal ownerPayout) {
            this.base        = base;
            this.gstAmount   = gstAmount;
            this.platformFee = platformFee;
            this.deposit     = deposit;
            this.totalAmount = totalAmount;
            this.ownerPayout = ownerPayout;
        }

        @Override
        public String toString() {
            return String.format(
                "Phase1Quote{base=%s, gst=%s, fee=%s, deposit=%s, total=%s, ownerPayout=%s}",
                base, gstAmount, platformFee, deposit, totalAmount, ownerPayout
            );
        }
    }

    /**
     * Calculate a Phase 1 price quote.
     *
     * @param rentalAmount    pricePerDay x totalDays (must be >= 0)
     * @param securityDeposit refundable deposit (>= 0)
     * @return Phase1Quote with all computed fields
     */
    public static Phase1Quote calcPhase1(
        BigDecimal rentalAmount,
        BigDecimal securityDeposit
    ) {
        BigDecimal base    = guard(rentalAmount);
        BigDecimal deposit = guard(securityDeposit);

        BigDecimal gstAmount   = scale(base.multiply(GST_RATE));
        BigDecimal platformFee = scale(base.multiply(PLATFORM_FEE_RATE));
        BigDecimal totalAmount = scale(base.add(gstAmount).add(platformFee).add(deposit));
        BigDecimal ownerPayout = scale(base.add(deposit));

        return new Phase1Quote(
            scale(base), gstAmount, platformFee,
            scale(deposit), totalAmount, ownerPayout
        );
    }

    // ── Phase 2 ───────────────────────────────────────────────────────────────

    public static final class Phase2Quote {
        public final BigDecimal base;
        public final BigDecimal gstOnBase;
        public final BigDecimal userPlatformFee;
        public final BigDecimal gstOnUserFee;
        public final BigDecimal ownerCommission;
        public final BigDecimal deposit;
        public final BigDecimal totalUserPays;
        public final BigDecimal ownerPayout;

        private Phase2Quote(BigDecimal base, BigDecimal gstOnBase,
                            BigDecimal userPlatformFee, BigDecimal gstOnUserFee,
                            BigDecimal ownerCommission, BigDecimal deposit,
                            BigDecimal totalUserPays, BigDecimal ownerPayout) {
            this.base             = base;
            this.gstOnBase        = gstOnBase;
            this.userPlatformFee  = userPlatformFee;
            this.gstOnUserFee     = gstOnUserFee;
            this.ownerCommission  = ownerCommission;
            this.deposit          = deposit;
            this.totalUserPays    = totalUserPays;
            this.ownerPayout      = ownerPayout;
        }
    }

    /**
     * Calculate a Phase 2 price quote — configurable rates.
     *
     * @param rentalAmount    base rental
     * @param userFeePct      platform fee rate for renter  e.g. new BigDecimal("0.05")
     * @param ownerFeePct     commission rate from owner    e.g. new BigDecimal("0.10")
     * @param securityDeposit deposit
     */
    public static Phase2Quote calcPhase2(
        BigDecimal rentalAmount,
        BigDecimal userFeePct,
        BigDecimal ownerFeePct,
        BigDecimal securityDeposit
    ) {
        BigDecimal base    = guard(rentalAmount);
        BigDecimal uFee    = guardRate(userFeePct);
        BigDecimal oFee    = guardRate(ownerFeePct);
        BigDecimal deposit = guard(securityDeposit);

        BigDecimal gstOnBase       = scale(base.multiply(GST_RATE));
        BigDecimal userPlatformFee = scale(base.multiply(uFee));
        BigDecimal gstOnUserFee    = scale(userPlatformFee.multiply(GST_RATE));
        BigDecimal ownerCommission = scale(base.multiply(oFee));

        BigDecimal totalUserPays = scale(
            base.add(gstOnBase).add(userPlatformFee).add(gstOnUserFee).add(deposit)
        );
        BigDecimal ownerPayout = scale(base.subtract(ownerCommission).add(deposit));

        return new Phase2Quote(
            scale(base), gstOnBase, userPlatformFee, gstOnUserFee,
            ownerCommission, scale(deposit), totalUserPays, ownerPayout
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static BigDecimal scale(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal guard(BigDecimal v) {
        if (v == null || v.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        return v;
    }

    private static BigDecimal guardRate(BigDecimal v) {
        if (v == null || v.compareTo(BigDecimal.ZERO) < 0) return BigDecimal.ZERO;
        if (v.compareTo(BigDecimal.ONE) > 0) return BigDecimal.ONE;
        return v;
    }
}
