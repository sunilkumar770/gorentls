package com.rentit.dto;

import lombok.Data;

@Data
public class UpdateSettingsRequest {
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private Boolean marketingEmails;
}
