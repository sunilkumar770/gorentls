package com.rentit.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ConfirmPaymentRequest(
    @NotNull(message = "bookingId is required")
    UUID bookingId,

    @NotBlank(message = "razorpayOrderId is required")
    String razorpayOrderId,

    @NotBlank(message = "razorpayPaymentId is required")
    String razorpayPaymentId,

    @NotBlank(message = "razorpaySignature is required")
    String razorpaySignature,

    /**
     * "ADVANCE" | "FINAL" | "SECURITY_DEPOSIT"
     */
    @NotBlank(message = "paymentKind is required")
    String paymentKind
) {}
