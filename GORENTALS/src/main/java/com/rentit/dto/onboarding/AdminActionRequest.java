package com.rentit.dto.onboarding;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminActionRequest(
    @NotBlank(message = "reason is required")
    @Size(min = 10, max = 500, message = "reason must be 10–500 characters")
    String reason
) {}
