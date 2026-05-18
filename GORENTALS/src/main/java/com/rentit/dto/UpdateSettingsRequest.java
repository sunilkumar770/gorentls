package com.rentit.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class UpdateSettingsRequest {
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private Boolean marketingEmails;
    private Boolean autoApproveBookings;
}
