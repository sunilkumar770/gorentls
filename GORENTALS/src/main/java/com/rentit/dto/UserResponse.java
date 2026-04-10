package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String userType;
    private Boolean isActive;
    private Boolean isVerified;
    private String kycStatus;
    private String kycDocumentType;
    private String kycDocumentId;
    private LocalDateTime createdAt;
}