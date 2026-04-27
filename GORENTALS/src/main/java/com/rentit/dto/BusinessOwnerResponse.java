package com.rentit.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class BusinessOwnerResponse {
    private UUID id;
    private UserResponse user;
    private String businessName;
    private String businessType;
    private String businessAddress;
    private String businessCity;
    private String businessState;
    private String businessPincode;
    private String businessPhone;
    private String businessEmail;
    private String gstNumber;
    private String panNumber;
    private String registrationNumber;
    private Boolean isVerified;
    private BigDecimal commissionRate;
    private LocalDateTime createdAt;

    private BusinessOwnerResponse(Builder builder) {
        this.id = builder.id;
        this.user = builder.user;
        this.businessName = builder.businessName;
        this.businessType = builder.businessType;
        this.businessAddress = builder.businessAddress;
        this.businessCity = builder.businessCity;
        this.businessState = builder.businessState;
        this.businessPincode = builder.businessPincode;
        this.businessPhone = builder.businessPhone;
        this.businessEmail = builder.businessEmail;
        this.gstNumber = builder.gstNumber;
        this.panNumber = builder.panNumber;
        this.registrationNumber = builder.registrationNumber;
        this.isVerified = builder.isVerified;
        this.commissionRate = builder.commissionRate;
        this.createdAt = builder.createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private UserResponse user;
        private String businessName;
        private String businessType;
        private String businessAddress;
        private String businessCity;
        private String businessState;
        private String businessPincode;
        private String businessPhone;
        private String businessEmail;
        private String gstNumber;
        private String panNumber;
        private String registrationNumber;
        private Boolean isVerified;
        private BigDecimal commissionRate;
        private LocalDateTime createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder user(UserResponse user) { this.user = user; return this; }
        public Builder businessName(String businessName) { this.businessName = businessName; return this; }
        public Builder businessType(String businessType) { this.businessType = businessType; return this; }
        public Builder businessAddress(String businessAddress) { this.businessAddress = businessAddress; return this; }
        public Builder businessCity(String businessCity) { this.businessCity = businessCity; return this; }
        public Builder businessState(String businessState) { this.businessState = businessState; return this; }
        public Builder businessPincode(String businessPincode) { this.businessPincode = businessPincode; return this; }
        public Builder businessPhone(String businessPhone) { this.businessPhone = businessPhone; return this; }
        public Builder businessEmail(String businessEmail) { this.businessEmail = businessEmail; return this; }
        public Builder gstNumber(String gstNumber) { this.gstNumber = gstNumber; return this; }
        public Builder panNumber(String panNumber) { this.panNumber = panNumber; return this; }
        public Builder registrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; return this; }
        public Builder isVerified(Boolean isVerified) { this.isVerified = isVerified; return this; }
        public Builder commissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public BusinessOwnerResponse build() {
            return new BusinessOwnerResponse(this);
        }
    }

    // Getters
    public UUID getId() { return id; }
    public UserResponse getUser() { return user; }
    public String getBusinessName() { return businessName; }
    public String getBusinessType() { return businessType; }
    public String getBusinessAddress() { return businessAddress; }
    public String getBusinessCity() { return businessCity; }
    public String getBusinessState() { return businessState; }
    public String getBusinessPincode() { return businessPincode; }
    public String getBusinessPhone() { return businessPhone; }
    public String getBusinessEmail() { return businessEmail; }
    public String getGstNumber() { return gstNumber; }
    public String getPanNumber() { return panNumber; }
    public String getRegistrationNumber() { return registrationNumber; }
    public Boolean getIsVerified() { return isVerified; }
    public BigDecimal getCommissionRate() { return commissionRate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
