package com.rentit.dto.onboarding;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubmitUpiRequest(
    @NotBlank(message = "ownerName is required")
    String ownerName,

    @NotBlank(message = "ownerEmail is required")
    @Email(message = "ownerEmail must be a valid email address")
    String ownerEmail,

    @NotBlank(message = "ownerPhone is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$",
             message = "ownerPhone must be a valid 10-digit Indian mobile number")
    String ownerPhone,

    @NotBlank(message = "upiId is required")
    @Pattern(regexp = "^[a-zA-Z0-9._\\-]{2,256}@[a-zA-Z]{2,64}$",
             message = "upiId must be a valid UPI VPA e.g. name@upi")
    String upiId
) {}
