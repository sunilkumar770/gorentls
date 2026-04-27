package com.rentit.dto.dispute;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ResolveDisputeRequest(
    /**
     * "REFUND" | "PAYOUT" | "SPLIT" | "REJECT"
     */
    @NotBlank(message = "resolution is required")
    String resolution,

    @NotBlank(message = "notes are required")
    @Size(min = 10, max = 1000, message = "notes must be 10–1000 characters")
    String notes,

    /** Required when resolution=REFUND or SPLIT (renterAmount > 0) */
    String razorpayPaymentId,

    /** Required when resolution=REFUND or SPLIT */
    BigDecimal refundAmount,

    /** Required when resolution=SPLIT */
    BigDecimal ownerAmount,

    /** Required when resolution=SPLIT or PAYOUT — owner's YTD payout sum for TDS */
    BigDecimal ownerAnnualRunning
) {}
