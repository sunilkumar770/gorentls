package com.rentit.service;

import com.rentit.pricing.PricingCalculator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

/**
 * Pure unit tests — no Spring context, no DB.
 * All method signatures match PricingCalculator as implemented in Chunk 5.
 */
class PricingCalculatorTest {




    // ── tds ───────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("tds()")
    class Tds {

        private static final BigDecimal THRESHOLD = new BigDecimal("500000.00");

        @Test
        @DisplayName("no TDS when YTD running is well below ₹5,00,000")
        void belowThreshold() {
            assertThat(PricingCalculator.tds(
                new BigDecimal("4000.00"),
                new BigDecimal("20000.00")
            )).isEqualByComparingTo("0.00");
        }

        @Test
        @DisplayName("partial TDS when this payout crosses the ₹5,00,000 threshold")
        void crossesThreshold() {
            // YTD = 495,000; gross = 10,000 → taxable = 5000
            // TDS = 0.1% × 5000 = 5.00
            assertThat(PricingCalculator.tds(
                new BigDecimal("10000.00"),
                new BigDecimal("495000.00")
            )).isEqualByComparingTo("5.00");
        }

        @Test
        @DisplayName("full 0.1% TDS when fully above ₹5,00,000 threshold")
        void fullyAboveThreshold() {
            // YTD = 600,000; gross = 10,000 → TDS = 10.00
            assertThat(PricingCalculator.tds(
                new BigDecimal("10000.00"),
                new BigDecimal("600000.00")
            )).isEqualByComparingTo("10.00");
        }

        @Test
        @DisplayName("exactly at threshold boundary: no TDS")
        void exactlyAtThreshold() {
            // YTD = 500,000; any new payout → fully taxable
            assertThat(PricingCalculator.tds(
                new BigDecimal("1000.00"),
                THRESHOLD
            )).isEqualByComparingTo("1.00");
        }
    }
}
