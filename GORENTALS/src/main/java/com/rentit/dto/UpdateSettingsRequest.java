package com.rentit.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class UpdateSettingsRequest {
    @NotNull(message = "emailNotifications flag is required")
    private Boolean emailNotifications;
    
    @NotNull(message = "smsNotifications flag is required")
    private Boolean smsNotifications;
    
    @NotNull(message = "marketingEmails flag is required")
    private Boolean marketingEmails;
}
