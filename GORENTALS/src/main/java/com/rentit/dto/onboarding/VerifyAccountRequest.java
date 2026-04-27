package com.rentit.dto.onboarding;

import jakarta.validation.constraints.NotBlank;

public record VerifyAccountRequest(
    @NotBlank(message = "fundAccountId is required")
    String fundAccountId,

    @NotBlank(message = "verificationRef is required")
    String verificationRef
) {}
