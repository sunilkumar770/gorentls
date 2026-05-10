package com.rentit.service;

import com.rentit.dto.OwnerAnalyticsDTO;
import com.rentit.dto.RecentBookingDTO;
import com.rentit.dto.RevenuePointDTO;
import com.rentit.model.Booking;
import com.rentit.model.enums.BookingStatus;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class OwnerAnalyticsService {

    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;

    public OwnerAnalyticsDTO getAnalytics(UUID ownerId) {
        long totalBookings = bookingRepository.countByOwnerIdAndBookingStatusIn(ownerId, 
            Arrays.asList(BookingStatus.values()));
        
        long confirmed = bookingRepository.countByOwnerIdAndBookingStatusIn(ownerId, 
            Arrays.asList(BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.IN_USE));
            
        long pending = bookingRepository.countByOwnerIdAndBookingStatus(ownerId, 
            BookingStatus.PENDING_PAYMENT);
            
        long rejected = bookingRepository.countByOwnerIdAndBookingStatusIn(ownerId, 
            Arrays.asList(BookingStatus.CANCELLED, BookingStatus.NO_SHOW));

        BigDecimal totalRevenue = bookingRepository.sumTotalAmountByOwnerIdAndBookingStatus(ownerId, 
            BookingStatus.COMPLETED);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        BigDecimal pendingRevenue = bookingRepository.sumTotalAmountByOwnerIdAndBookingStatusIn(ownerId, 
            Arrays.asList(BookingStatus.CONFIRMED, BookingStatus.IN_USE, BookingStatus.RETURNED));
        if (pendingRevenue == null) pendingRevenue = BigDecimal.ZERO;

        BigDecimal averageBookingValue = totalBookings > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalBookings), 2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;

        List<RecentBookingDTO> recentBookings = bookingRepository.findByOwnerId(ownerId, PageRequest.of(0, 5))
                .getContent().stream()
                .map(this::mapToRecentBooking)
                .collect(Collectors.toList());

        List<RevenuePointDTO> revenueTrend = getRevenueTrend(ownerId, 6);

        OwnerAnalyticsDTO dto = new OwnerAnalyticsDTO();
        dto.setTotalRevenue(totalRevenue);
        dto.setPendingRevenue(pendingRevenue);
        dto.setTotalBookings(totalBookings);
        dto.setConfirmedBookings(confirmed);
        dto.setPendingBookings(pending);
        dto.setRejectedBookings(rejected);
        dto.setCompletionRate(totalBookings > 0 ? (double) confirmed / totalBookings * 100 : 0);
        dto.setActiveListings(listingRepository.countActiveByOwnerId(ownerId));
        dto.setTotalListings(listingRepository.countByOwnerId(ownerId));
        dto.setAverageBookingValue(averageBookingValue);
        dto.setRecentBookings(recentBookings);
        dto.setRevenueChart(revenueTrend);
        
        return dto;
    }

    public List<RevenuePointDTO> getRevenueTrend(UUID ownerId, int months) {
        LocalDateTime start = LocalDateTime.now().minusMonths(months);
        List<Object[]> results = bookingRepository.getMonthlyRevenueByOwnerId(ownerId, start);

        return results.stream()
                .filter(row -> row != null && row.length >= 2 && row[0] != null)
                .map(row -> {
                    BigDecimal amount = BigDecimal.ZERO;
                    if (row[1] != null) {
                        amount = row[1] instanceof BigDecimal ? (BigDecimal) row[1] : new BigDecimal(row[1].toString());
                    }
                    return new RevenuePointDTO(row[0].toString(), amount);
                })
                .collect(Collectors.toList());
    }

    private RecentBookingDTO mapToRecentBooking(Booking booking) {
        String title = booking.getListing() != null ? booking.getListing().getTitle() : "Unknown Listing";
        String renter = booking.getRenter() != null ? booking.getRenter().getFullName() : "Unknown Renter";
        String status = booking.getBookingStatus() != null ? booking.getBookingStatus().name() : "UNKNOWN";
        BigDecimal amt = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;

        RecentBookingDTO dto = new RecentBookingDTO();
        dto.setId(booking.getId());
        dto.setListingTitle(title);
        dto.setRenterName(renter);
        dto.setAmount(amt);
        dto.setStatus(status);
        dto.setCreatedAt(booking.getCreatedAt());
        
        return dto;
    }
}
