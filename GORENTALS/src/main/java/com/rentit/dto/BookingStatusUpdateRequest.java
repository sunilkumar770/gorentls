package com.rentit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for PATCH /api/bookings/{id}/status.
 *
 * Replaces the raw Map&lt;String, String&gt; anti-pattern with a typed,
 * Jakarta-validated DTO that prevents invalid enum strings from reaching
 * the service layer.
 */
@Data
public class BookingStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
        regexp = "^(IN_USE|RETURNED|COMPLETED|NO_SHOW|DISPUTED|CANCELLED)$",
        message = "Invalid status. Allowed: IN_USE, RETURNED, COMPLETED, NO_SHOW, DISPUTED, CANCELLED"
    )
    private String status;

    /**
     * Optional: reason for cancellation or rejection.
     * Used for audit trail and notification messages. Max 500 characters.
     */
    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;
}
