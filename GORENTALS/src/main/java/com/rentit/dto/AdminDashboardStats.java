package com.rentit.dto;

import java.math.BigDecimal;

public class AdminDashboardStats {
    private Long totalUsers;
    private Long totalOwners;
    private Long totalRenters;
    private Long totalListings;
    private Long activeListings;
    private Long pendingListings;
    private Long totalBookings;
    private Long activeBookings;
    private Long completedBookings;
    private BigDecimal totalRevenue;
    private BigDecimal platformCommission;
    private Long pendingKYC;
    private Long pendingOwnerVerifications;

    private AdminDashboardStats(Builder builder) {
        this.totalUsers = builder.totalUsers;
        this.totalOwners = builder.totalOwners;
        this.totalRenters = builder.totalRenters;
        this.totalListings = builder.totalListings;
        this.activeListings = builder.activeListings;
        this.pendingListings = builder.pendingListings;
        this.totalBookings = builder.totalBookings;
        this.activeBookings = builder.activeBookings;
        this.completedBookings = builder.completedBookings;
        this.totalRevenue = builder.totalRevenue;
        this.platformCommission = builder.platformCommission;
        this.pendingKYC = builder.pendingKYC;
        this.pendingOwnerVerifications = builder.pendingOwnerVerifications;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long totalUsers;
        private Long totalOwners;
        private Long totalRenters;
        private Long totalListings;
        private Long activeListings;
        private Long pendingListings;
        private Long totalBookings;
        private Long activeBookings;
        private Long completedBookings;
        private BigDecimal totalRevenue;
        private BigDecimal platformCommission;
        private Long pendingKYC;
        private Long pendingOwnerVerifications;

        public Builder totalUsers(Long totalUsers) {
            this.totalUsers = totalUsers;
            return this;
        }

        public Builder totalOwners(Long totalOwners) {
            this.totalOwners = totalOwners;
            return this;
        }

        public Builder totalRenters(Long totalRenters) {
            this.totalRenters = totalRenters;
            return this;
        }

        public Builder totalListings(Long totalListings) {
            this.totalListings = totalListings;
            return this;
        }

        public Builder activeListings(Long activeListings) {
            this.activeListings = activeListings;
            return this;
        }

        public Builder pendingListings(Long pendingListings) {
            this.pendingListings = pendingListings;
            return this;
        }

        public Builder totalBookings(Long totalBookings) {
            this.totalBookings = totalBookings;
            return this;
        }

        public Builder activeBookings(Long activeBookings) {
            this.activeBookings = activeBookings;
            return this;
        }

        public Builder completedBookings(Long completedBookings) {
            this.completedBookings = completedBookings;
            return this;
        }

        public Builder totalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
            return this;
        }

        public Builder platformCommission(BigDecimal platformCommission) {
            this.platformCommission = platformCommission;
            return this;
        }

        public Builder pendingKYC(Long pendingKYC) {
            this.pendingKYC = pendingKYC;
            return this;
        }

        public Builder pendingOwnerVerifications(Long pendingOwnerVerifications) {
            this.pendingOwnerVerifications = pendingOwnerVerifications;
            return this;
        }

        public AdminDashboardStats build() {
            return new AdminDashboardStats(this);
        }
    }

    // Getters
    public Long getTotalUsers() { return totalUsers; }
    public Long getTotalOwners() { return totalOwners; }
    public Long getTotalRenters() { return totalRenters; }
    public Long getTotalListings() { return totalListings; }
    public Long getActiveListings() { return activeListings; }
    public Long getPendingListings() { return pendingListings; }
    public Long getTotalBookings() { return totalBookings; }
    public Long getActiveBookings() { return activeBookings; }
    public Long getCompletedBookings() { return completedBookings; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public BigDecimal getPlatformCommission() { return platformCommission; }
    public Long getPendingKYC() { return pendingKYC; }
    public Long getPendingOwnerVerifications() { return pendingOwnerVerifications; }
}
