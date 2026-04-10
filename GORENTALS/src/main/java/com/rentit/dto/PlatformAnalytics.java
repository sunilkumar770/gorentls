package com.rentit.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class PlatformAnalytics {
    private UserStatistics userStatistics;
    private BookingStatistics bookingStatistics;
    private RevenueStatistics revenueStatistics;
    private GrowthStatistics growthStatistics;
    private List<CategoryStat> topCategories;
    private List<CityStat> topCities;

    private PlatformAnalytics(Builder builder) {
        this.userStatistics = builder.userStatistics;
        this.bookingStatistics = builder.bookingStatistics;
        this.revenueStatistics = builder.revenueStatistics;
        this.growthStatistics = builder.growthStatistics;
        this.topCategories = builder.topCategories;
        this.topCities = builder.topCities;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UserStatistics userStatistics;
        private BookingStatistics bookingStatistics;
        private RevenueStatistics revenueStatistics;
        private GrowthStatistics growthStatistics;
        private List<CategoryStat> topCategories;
        private List<CityStat> topCities;

        public Builder userStatistics(UserStatistics userStatistics) { this.userStatistics = userStatistics; return this; }
        public Builder bookingStatistics(BookingStatistics bookingStatistics) { this.bookingStatistics = bookingStatistics; return this; }
        public Builder revenueStatistics(RevenueStatistics revenueStatistics) { this.revenueStatistics = revenueStatistics; return this; }
        public Builder growthStatistics(GrowthStatistics growthStatistics) { this.growthStatistics = growthStatistics; return this; }
        public Builder topCategories(List<CategoryStat> topCategories) { this.topCategories = topCategories; return this; }
        public Builder topCities(List<CityStat> topCities) { this.topCities = topCities; return this; }

        public PlatformAnalytics build() {
            return new PlatformAnalytics(this);
        }
    }

    // Inner Classes
    public static class UserStatistics {
        private Long totalUsers;
        private Long totalOwners;
        private Long totalRenters;
        private Long newUsersThisMonth;
        private Long newOwnersThisMonth;
        private Long verifiedUsers;

        private UserStatistics(Builder builder) {
            this.totalUsers = builder.totalUsers;
            this.totalOwners = builder.totalOwners;
            this.totalRenters = builder.totalRenters;
            this.newUsersThisMonth = builder.newUsersThisMonth;
            this.newOwnersThisMonth = builder.newOwnersThisMonth;
            this.verifiedUsers = builder.verifiedUsers;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Long totalUsers;
            private Long totalOwners;
            private Long totalRenters;
            private Long newUsersThisMonth;
            private Long newOwnersThisMonth;
            private Long verifiedUsers;

            public Builder totalUsers(Long totalUsers) { this.totalUsers = totalUsers; return this; }
            public Builder totalOwners(Long totalOwners) { this.totalOwners = totalOwners; return this; }
            public Builder totalRenters(Long totalRenters) { this.totalRenters = totalRenters; return this; }
            public Builder newUsersThisMonth(Long newUsersThisMonth) { this.newUsersThisMonth = newUsersThisMonth; return this; }
            public Builder newOwnersThisMonth(Long newOwnersThisMonth) { this.newOwnersThisMonth = newOwnersThisMonth; return this; }
            public Builder verifiedUsers(Long verifiedUsers) { this.verifiedUsers = verifiedUsers; return this; }
            public UserStatistics build() { return new UserStatistics(this); }
        }

        // Getters
        public Long getTotalUsers() { return totalUsers; }
        public Long getTotalOwners() { return totalOwners; }
        public Long getTotalRenters() { return totalRenters; }
        public Long getNewUsersThisMonth() { return newUsersThisMonth; }
        public Long getNewOwnersThisMonth() { return newOwnersThisMonth; }
        public Long getVerifiedUsers() { return verifiedUsers; }
    }

    public static class BookingStatistics {
        private Long totalBookings;
        private Long completedBookings;
        private Long cancelledBookings;
        private Long activeBookings;
        private Double averageBookingValue;
        private Double averageRentalDays;

        private BookingStatistics(Builder builder) {
            this.totalBookings = builder.totalBookings;
            this.completedBookings = builder.completedBookings;
            this.cancelledBookings = builder.cancelledBookings;
            this.activeBookings = builder.activeBookings;
            this.averageBookingValue = builder.averageBookingValue;
            this.averageRentalDays = builder.averageRentalDays;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Long totalBookings;
            private Long completedBookings;
            private Long cancelledBookings;
            private Long activeBookings;
            private Double averageBookingValue;
            private Double averageRentalDays;

            public Builder totalBookings(Long totalBookings) { this.totalBookings = totalBookings; return this; }
            public Builder completedBookings(Long completedBookings) { this.completedBookings = completedBookings; return this; }
            public Builder cancelledBookings(Long cancelledBookings) { this.cancelledBookings = cancelledBookings; return this; }
            public Builder activeBookings(Long activeBookings) { this.activeBookings = activeBookings; return this; }
            public Builder averageBookingValue(Double averageBookingValue) { this.averageBookingValue = averageBookingValue; return this; }
            public Builder averageRentalDays(Double averageRentalDays) { this.averageRentalDays = averageRentalDays; return this; }
            public BookingStatistics build() { return new BookingStatistics(this); }
        }

        // Getters
        public Long getTotalBookings() { return totalBookings; }
        public Long getCompletedBookings() { return completedBookings; }
        public Long getCancelledBookings() { return cancelledBookings; }
        public Long getActiveBookings() { return activeBookings; }
        public Double getAverageBookingValue() { return averageBookingValue; }
        public Double getAverageRentalDays() { return averageRentalDays; }
    }

    public static class RevenueStatistics {
        private BigDecimal totalRevenue;
        private BigDecimal platformCommission;
        private BigDecimal ownerPayouts;
        private BigDecimal monthlyRevenue;
        private BigDecimal weeklyRevenue;
        private Map<String, BigDecimal> revenueByMonth;

        private RevenueStatistics(Builder builder) {
            this.totalRevenue = builder.totalRevenue;
            this.platformCommission = builder.platformCommission;
            this.ownerPayouts = builder.ownerPayouts;
            this.monthlyRevenue = builder.monthlyRevenue;
            this.weeklyRevenue = builder.weeklyRevenue;
            this.revenueByMonth = builder.revenueByMonth;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private BigDecimal totalRevenue;
            private BigDecimal platformCommission;
            private BigDecimal ownerPayouts;
            private BigDecimal monthlyRevenue;
            private BigDecimal weeklyRevenue;
            private Map<String, BigDecimal> revenueByMonth;

            public Builder totalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; return this; }
            public Builder platformCommission(BigDecimal platformCommission) { this.platformCommission = platformCommission; return this; }
            public Builder ownerPayouts(BigDecimal ownerPayouts) { this.ownerPayouts = ownerPayouts; return this; }
            public Builder monthlyRevenue(BigDecimal monthlyRevenue) { this.monthlyRevenue = monthlyRevenue; return this; }
            public Builder weeklyRevenue(BigDecimal weeklyRevenue) { this.weeklyRevenue = weeklyRevenue; return this; }
            public Builder revenueByMonth(Map<String, BigDecimal> revenueByMonth) { this.revenueByMonth = revenueByMonth; return this; }
            public RevenueStatistics build() { return new RevenueStatistics(this); }
        }

        // Getters
        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public BigDecimal getPlatformCommission() { return platformCommission; }
        public BigDecimal getOwnerPayouts() { return ownerPayouts; }
        public BigDecimal getMonthlyRevenue() { return monthlyRevenue; }
        public BigDecimal getWeeklyRevenue() { return weeklyRevenue; }
        public Map<String, BigDecimal> getRevenueByMonth() { return revenueByMonth; }
    }

    public static class GrowthStatistics {
        private Double userGrowthRate;
        private Double bookingGrowthRate;
        private Double revenueGrowthRate;
        private List<MonthlyStat> monthlyStats;

        private GrowthStatistics(Builder builder) {
            this.userGrowthRate = builder.userGrowthRate;
            this.bookingGrowthRate = builder.bookingGrowthRate;
            this.revenueGrowthRate = builder.revenueGrowthRate;
            this.monthlyStats = builder.monthlyStats;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Double userGrowthRate;
            private Double bookingGrowthRate;
            private Double revenueGrowthRate;
            private List<MonthlyStat> monthlyStats;

            public Builder userGrowthRate(Double userGrowthRate) { this.userGrowthRate = userGrowthRate; return this; }
            public Builder bookingGrowthRate(Double bookingGrowthRate) { this.bookingGrowthRate = bookingGrowthRate; return this; }
            public Builder revenueGrowthRate(Double revenueGrowthRate) { this.revenueGrowthRate = revenueGrowthRate; return this; }
            public Builder monthlyStats(List<MonthlyStat> monthlyStats) { this.monthlyStats = monthlyStats; return this; }
            public GrowthStatistics build() { return new GrowthStatistics(this); }
        }

        // Getters
        public Double getUserGrowthRate() { return userGrowthRate; }
        public Double getBookingGrowthRate() { return bookingGrowthRate; }
        public Double getRevenueGrowthRate() { return revenueGrowthRate; }
        public List<MonthlyStat> getMonthlyStats() { return monthlyStats; }
    }

    public static class CategoryStat {
        private String category;
        private Long count;
        private BigDecimal totalValue;

        private CategoryStat(Builder builder) {
            this.category = builder.category;
            this.count = builder.count;
            this.totalValue = builder.totalValue;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String category;
            private Long count;
            private BigDecimal totalValue;

            public Builder category(String category) { this.category = category; return this; }
            public Builder count(Long count) { this.count = count; return this; }
            public Builder totalValue(BigDecimal totalValue) { this.totalValue = totalValue; return this; }
            public CategoryStat build() { return new CategoryStat(this); }
        }

        // Getters
        public String getCategory() { return category; }
        public Long getCount() { return count; }
        public BigDecimal getTotalValue() { return totalValue; }
    }

    public static class CityStat {
        private String city;
        private Long listingCount;
        private Long bookingCount;
        private BigDecimal revenue;

        private CityStat(Builder builder) {
            this.city = builder.city;
            this.listingCount = builder.listingCount;
            this.bookingCount = builder.bookingCount;
            this.revenue = builder.revenue;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String city;
            private Long listingCount;
            private Long bookingCount;
            private BigDecimal revenue;

            public Builder city(String city) { this.city = city; return this; }
            public Builder listingCount(Long listingCount) { this.listingCount = listingCount; return this; }
            public Builder bookingCount(Long bookingCount) { this.bookingCount = bookingCount; return this; }
            public Builder revenue(BigDecimal revenue) { this.revenue = revenue; return this; }
            public CityStat build() { return new CityStat(this); }
        }

        // Getters
        public String getCity() { return city; }
        public Long getListingCount() { return listingCount; }
        public Long getBookingCount() { return bookingCount; }
        public BigDecimal getRevenue() { return revenue; }
    }

    public static class MonthlyStat {
        private String month;
        private Long newUsers;
        private Long bookings;
        private BigDecimal revenue;

        private MonthlyStat(Builder builder) {
            this.month = builder.month;
            this.newUsers = builder.newUsers;
            this.bookings = builder.bookings;
            this.revenue = builder.revenue;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String month;
            private Long newUsers;
            private Long bookings;
            private BigDecimal revenue;

            public Builder month(String month) { this.month = month; return this; }
            public Builder newUsers(Long newUsers) { this.newUsers = newUsers; return this; }
            public Builder bookings(Long bookings) { this.bookings = bookings; return this; }
            public Builder revenue(BigDecimal revenue) { this.revenue = revenue; return this; }
            public MonthlyStat build() { return new MonthlyStat(this); }
        }

        // Getters
        public String getMonth() { return month; }
        public Long getNewUsers() { return newUsers; }
        public Long getBookings() { return bookings; }
        public BigDecimal getRevenue() { return revenue; }
    }

    // Getters for PlatformAnalytics
    public UserStatistics getUserStatistics() { return userStatistics; }
    public BookingStatistics getBookingStatistics() { return bookingStatistics; }
    public RevenueStatistics getRevenueStatistics() { return revenueStatistics; }
    public GrowthStatistics getGrowthStatistics() { return growthStatistics; }
    public List<CategoryStat> getTopCategories() { return topCategories; }
    public List<CityStat> getTopCities() { return topCities; }
}