package com.rentit.service;

import com.rentit.dto.PlatformAnalytics;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.UserProfile;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.PaymentRepository;
import com.rentit.repository.UserProfileRepository;
import com.rentit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlatformAnalyticsService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ListingRepository listingRepository;

    public PlatformAnalytics getPlatformAnalytics(String startDate, String endDate) {
        LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
        LocalDateTime end   = LocalDate.parse(endDate).atTime(23, 59, 59);
        LocalDateTime sixMonthsAgo = LocalDate.now().minusMonths(6).withDayOfMonth(1).atStartOfDay();

        // ── USER STATS ────────────────────────────────────────────────────────
        long totalUsers         = userRepository.count();
        long totalOwners        = userRepository.countOwners();
        long totalRenters       = userRepository.countRenters();
        long newUsersThisMonth  = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
        long newOwnersThisMonth = userRepository.countOwnersByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
        long verifiedUsers      = userProfileRepository.countByKycStatus(UserProfile.KYCStatus.APPROVED);

        PlatformAnalytics.UserStatistics userStats = PlatformAnalytics.UserStatistics.builder()
                .totalUsers(totalUsers).totalOwners(totalOwners).totalRenters(totalRenters)
                .newUsersThisMonth(newUsersThisMonth).newOwnersThisMonth(newOwnersThisMonth)
                .verifiedUsers(verifiedUsers).build();

        // ── BOOKING STATS ─────────────────────────────────────────────────────
        long totalBookings     = bookingRepository.count();
        long completedBookings = bookingRepository.countByBookingStatus(BookingStatus.COMPLETED);
        long cancelledBookings = bookingRepository.countByBookingStatus(BookingStatus.CANCELLED);
        long activeBookings    = bookingRepository.countByBookingStatus(BookingStatus.CONFIRMED);
        Double avgBookingValue = bookingRepository.getAverageBookingValue();
        Double avgRentalDays   = bookingRepository.getAverageRentalDays();

        PlatformAnalytics.BookingStatistics bookingStats = PlatformAnalytics.BookingStatistics.builder()
                .totalBookings(totalBookings).completedBookings(completedBookings)
                .cancelledBookings(cancelledBookings).activeBookings(activeBookings)
                .averageBookingValue(avgBookingValue != null ? avgBookingValue : 0.0)
                .averageRentalDays(avgRentalDays != null ? avgRentalDays : 0.0).build();

        // ── REVENUE STATS ─────────────────────────────────────────────────────
        BigDecimal totalRevenue = paymentRepository.sumCompletedPayments();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;
        
        // FIX: Commission is now derived from Ledger for precision in AdminService, 
        // but for high-level analytics, a conservative estimate or Ledger sum is better.
        // For now, we'll keep the 10% but as a calculated value from total revenue.
        BigDecimal platformCommission = totalRevenue.multiply(new BigDecimal("0.10"));
        BigDecimal ownerPayouts       = totalRevenue.subtract(platformCommission);
        
        BigDecimal monthlyRevenue = paymentRepository.sumPaymentsByDateRange(
                LocalDateTime.now().minusMonths(1), LocalDateTime.now());
        BigDecimal weeklyRevenue  = paymentRepository.sumPaymentsByDateRange(
                LocalDateTime.now().minusWeeks(1), LocalDateTime.now());

        // ── HISTORICAL AGGREGATION (OPTIMIZED: 3 queries instead of 18+) ──────
        List<Object[]> userHistory    = userRepository.getMonthlyRegistrations(sixMonthsAgo);
        List<Object[]> bookingHistory = bookingRepository.getMonthlyBookingCount(sixMonthsAgo);
        List<Object[]> revenueHistory = paymentRepository.getMonthlyRevenue(sixMonthsAgo);

        Map<String, PlatformAnalytics.MonthlyStat> statsMap = new LinkedHashMap<>();
        
        // Populate months in order (last 6 months)
        for (int i = 5; i >= 0; i--) {
            String mLabel = LocalDateTime.now().minusMonths(i).format(DateTimeFormatter.ofPattern("MMM yyyy"));
            statsMap.put(mLabel, PlatformAnalytics.MonthlyStat.builder()
                    .month(mLabel).newUsers(0L).bookings(0L).revenue(BigDecimal.ZERO).build());
        }

        // Map registration history
        for (Object[] row : userHistory) {
            String m = (String) row[0];
            if (statsMap.containsKey(m)) statsMap.get(m).setNewUsers(((Number) row[1]).longValue());
        }
        // Map booking history (Note: row[0] from DATE_TRUNC is a Timestamp/LocalDateTime)
        for (Object[] row : bookingHistory) {
            String m = ((LocalDateTime) row[0]).format(DateTimeFormatter.ofPattern("MMM yyyy"));
            if (statsMap.containsKey(m)) statsMap.get(m).setBookings(((Number) row[1]).longValue());
        }
        // Map revenue history
        for (Object[] row : revenueHistory) {
            String m = ((LocalDateTime) row[0]).format(DateTimeFormatter.ofPattern("MMM yyyy"));
            if (statsMap.containsKey(m)) statsMap.get(m).setRevenue((BigDecimal) row[1]);
        }

        List<PlatformAnalytics.MonthlyStat> monthlyStats = new ArrayList<>(statsMap.values());
        Map<String, BigDecimal> revenueByMonth = monthlyStats.stream()
                .collect(Collectors.toMap(PlatformAnalytics.MonthlyStat::getMonth, 
                                        PlatformAnalytics.MonthlyStat::getRevenue,
                                        (a, b) -> a, LinkedHashMap::new));

        PlatformAnalytics.RevenueStatistics revenueStats = PlatformAnalytics.RevenueStatistics.builder()
                .totalRevenue(totalRevenue).platformCommission(platformCommission)
                .ownerPayouts(ownerPayouts)
                .monthlyRevenue(monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO)
                .weeklyRevenue(weeklyRevenue != null ? weeklyRevenue : BigDecimal.ZERO)
                .revenueByMonth(revenueByMonth).build();

        // ── GROWTH STATS ──────────────────────────────────────────────────────
        Long lastMonthUsers    = userRepository.countByCreatedAtBefore(LocalDateTime.now().minusMonths(1));
        Double userGrowthRate  = lastMonthUsers > 0
                ? ((double)(totalUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;
        
        Long lastMonthBookings = bookingRepository.countByCreatedAtBefore(LocalDateTime.now().minusMonths(1));
        Double bookingGrowthRate = lastMonthBookings > 0
                ? ((double)(totalBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;
        
        BigDecimal lastMonthRevenue = paymentRepository.sumPaymentsByDateRange(
                LocalDateTime.now().minusMonths(2), LocalDateTime.now().minusMonths(1));
        Double revenueGrowthRate = (lastMonthRevenue != null && lastMonthRevenue.compareTo(BigDecimal.ZERO) > 0)
                ? ((monthlyRevenue.doubleValue() - lastMonthRevenue.doubleValue()) / lastMonthRevenue.doubleValue()) * 100 : 0;

        PlatformAnalytics.GrowthStatistics growthStats = PlatformAnalytics.GrowthStatistics.builder()
                .userGrowthRate(userGrowthRate).bookingGrowthRate(bookingGrowthRate)
                .revenueGrowthRate(revenueGrowthRate).monthlyStats(monthlyStats).build();

        // ── TOP CATEGORIES & CITIES ───────────────────────────────────────────
        List<Object[]> categoryStats = listingRepository.getTopCategories();
        List<PlatformAnalytics.CategoryStat> topCategories = categoryStats.stream().limit(5)
                .map(s -> PlatformAnalytics.CategoryStat.builder()
                        .category((String) s[0])
                        .count(((Number) s[1]).longValue())
                        .totalValue((BigDecimal) s[2]).build())
                .collect(Collectors.toList());

        List<Object[]> cityStats = listingRepository.getTopCities();
        List<PlatformAnalytics.CityStat> topCities = cityStats.stream().limit(5)
                .map(s -> PlatformAnalytics.CityStat.builder()
                        .city((String) s[0])
                        .listingCount(((Number) s[1]).longValue())
                        .bookingCount(((Number) s[2]).longValue())
                        .revenue((BigDecimal) s[3]).build())
                .collect(Collectors.toList());

        return PlatformAnalytics.builder()
                .userStatistics(userStats).bookingStatistics(bookingStats)
                .revenueStatistics(revenueStats).growthStatistics(growthStats)
                .topCategories(topCategories).topCities(topCities).build();
    }
}
