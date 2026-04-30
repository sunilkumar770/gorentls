package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerAnalyticsDTO {
    private BigDecimal totalRevenue;
    private BigDecimal pendingRevenue;
    private long totalBookings;
    private long confirmedBookings;
    private long pendingBookings;
    private long rejectedBookings;
    private double completionRate;
    private long activeListings;
    private long totalListings;
    private BigDecimal averageBookingValue;
    private List<RecentBookingDTO> recentBookings;
    private List<RevenuePointDTO> revenueChart;
}
