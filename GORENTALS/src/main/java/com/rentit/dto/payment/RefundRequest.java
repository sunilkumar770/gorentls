package com.rentit.dto.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record RefundRequest(
    @NotNull(message = "bookingId is required")
    UUID bookingId,

    @NotBlank(message = "razorpayPaymentId is required")
    String razorpayPaymentId,

    @NotNull(message = "amount is required")
    @DecimalMin(value = "1.00", message = "Refund amount must be at least ₹1")
    BigDecimal amount,

    /** "customer_request" | "fraudulent" | "duplicate" | "dispute_resolution" */
    @NotBlank(message = "reason is required")
    String reason
) {}
