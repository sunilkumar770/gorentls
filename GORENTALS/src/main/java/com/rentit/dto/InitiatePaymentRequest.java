package com.rentit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InitiatePaymentRequest {

    @NotBlank(message = "bookingId is required")
    private String bookingId;
}
