package com.rentit.dto.dispute;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record OpenDisputeRequest(
    @NotNull(message = "bookingId is required")
    UUID bookingId,

    /**
     * "RENTER" | "OWNER"
     */
    @NotBlank(message = "openedByRole is required")
    String openedByRole,

    /**
     * "NOT_DELIVERED" | "DAMAGED_ITEM" | "LATE_RETURN" | "WRONG_ITEM" | "OTHER"
     */
    @NotBlank(message = "reasonCode is required")
    String reasonCode,

    @NotBlank(message = "description is required")
    @Size(min = 20, max = 2000, message = "description must be 20–2000 characters")
    String description,

    /**
     * List of pre-uploaded S3/GCS URLs.
     * Max 10 evidence files enforced in service.
     */
    @Size(max = 10, message = "Maximum 10 evidence files allowed")
    List<String> evidenceUrls
) {}
