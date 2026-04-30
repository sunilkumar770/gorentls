package com.rentit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BroadcastNotificationRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title must be at most 120 characters")
    private String title;

    @NotBlank(message = "Message is required")
    @Size(max = 1000, message = "Message must be at most 1000 characters")
    private String message;

    @NotBlank(message = "Type is required")
    @Size(max = 50, message = "Type must be at most 50 characters")
    private String type = "SYSTEM";
}
