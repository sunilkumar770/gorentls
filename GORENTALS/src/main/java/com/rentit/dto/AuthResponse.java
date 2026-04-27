package com.rentit.dto;

import java.util.UUID;

public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String userType;
    private String email;
    private String fullName;
    private UUID userId;

    private AuthResponse(Builder builder) {
        this.accessToken = builder.accessToken;
        this.refreshToken = builder.refreshToken;
        this.userType = builder.userType;
        this.email = builder.email;
        this.fullName = builder.fullName;
        this.userId = builder.userId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String accessToken;
        private String refreshToken;
        private String userType;
        private String email;
        private String fullName;
        private UUID userId;

        public Builder accessToken(String accessToken) { this.accessToken = accessToken; return this; }
        public Builder refreshToken(String refreshToken) { this.refreshToken = refreshToken; return this; }
        public Builder userType(String userType) { this.userType = userType; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder userId(UUID userId) { this.userId = userId; return this; }

        public AuthResponse build() {
            return new AuthResponse(this);
        }
    }

    // Getters
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getUserType() { return userType; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public UUID getUserId() { return userId; }

    // Setters
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public void setUserType(String userType) { this.userType = userType; }
    public void setEmail(String email) { this.email = email; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setUserId(UUID userId) { this.userId = userId; }
}
