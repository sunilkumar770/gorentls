package com.rentit.pricing;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

class PricingCalculatorTest {

    @Test
    void testCalcPhase1() {
        BigDecimal rentalAmount = new BigDecimal("1000.00");
        BigDecimal securityDeposit = new BigDecimal("500.00");

        PricingCalculator.Phase1Quote quote = PricingCalculator.calcPhase1(rentalAmount, securityDeposit);

        // base = 1000.00
        // gst = 1000 * 0.18 = 180.00
        // fee = 1000 * 0.05 = 50.00
        // total = 1000 + 180 + 50 + 500 = 1730.00
        // ownerPayout = 1000 + 500 = 1500.00

        assertEquals(new BigDecimal("1000.00"), quote.base);
        assertEquals(new BigDecimal("180.00"), quote.gstAmount);
        assertEquals(new BigDecimal("50.00"), quote.platformFee);
        assertEquals(new BigDecimal("500.00"), quote.deposit);
        assertEquals(new BigDecimal("1730.00"), quote.totalAmount);
        assertEquals(new BigDecimal("1500.00"), quote.ownerPayout);
    }

    @Test
    void testCalcPhase1WithZeroDeposit() {
        BigDecimal rentalAmount = new BigDecimal("2000.00");
        BigDecimal securityDeposit = BigDecimal.ZERO;

        PricingCalculator.Phase1Quote quote = PricingCalculator.calcPhase1(rentalAmount, securityDeposit);

        assertEquals(new BigDecimal("2000.00"), quote.base);
        assertEquals(new BigDecimal("360.00"), quote.gstAmount);
        assertEquals(new BigDecimal("100.00"), quote.platformFee);
        assertEquals(BigDecimal.ZERO.setScale(2), quote.deposit);
        assertEquals(new BigDecimal("2460.00"), quote.totalAmount);
        assertEquals(new BigDecimal("2000.00"), quote.ownerPayout);
    }
}
