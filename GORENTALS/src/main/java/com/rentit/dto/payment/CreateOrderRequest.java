package com.rentit.dto.payment;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateOrderRequest(
    @NotNull(message = "bookingId is required")
    UUID bookingId,

    /**
     * "ADVANCE" | "FINAL" | "SECURITY_DEPOSIT"
     * Defaults to ADVANCE if omitted — validated in service.
     */
    String paymentKind
) {}
