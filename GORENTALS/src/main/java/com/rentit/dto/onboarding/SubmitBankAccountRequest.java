package com.rentit.dto.onboarding;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SubmitBankAccountRequest(
    @NotBlank(message = "ownerName is required")
    String ownerName,

    @NotBlank(message = "ownerEmail is required")
    @Email(message = "ownerEmail must be a valid email address")
    String ownerEmail,

    @NotBlank(message = "ownerPhone is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$",
             message = "ownerPhone must be a valid 10-digit Indian mobile number")
    String ownerPhone,

    @NotBlank(message = "accountNumber is required")
    @Pattern(regexp = "^[0-9]{9,18}$",
             message = "accountNumber must be 9–18 digits")
    String accountNumber,

    @NotBlank(message = "ifsc is required")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$",
             message = "ifsc must match format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)")
    String ifsc
) {}
