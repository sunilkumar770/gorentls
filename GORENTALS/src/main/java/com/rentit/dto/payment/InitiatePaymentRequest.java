package com.rentit.dto.payment;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InitiatePaymentRequest {
    @NotBlank(message = "Booking ID is required")
    private String bookingId;
}
