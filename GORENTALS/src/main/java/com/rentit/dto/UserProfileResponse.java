package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    // From User table
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String userType;
    private Boolean isActive;
    private LocalDateTime createdAt;

    // From UserProfile table
    private String profilePicture;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private LocalDate dateOfBirth;
    private String kycStatus;
    private String kycDocumentType;
    private String kycDocumentId;
    private String kycDocumentUrl;
}
