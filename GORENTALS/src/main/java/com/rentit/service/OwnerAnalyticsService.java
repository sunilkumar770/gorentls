package com.rentit.service;

import com.rentit.dto.OwnerAnalyticsDTO;
import com.rentit.dto.RecentBookingDTO;
import com.rentit.dto.RevenuePointDTO;
import com.rentit.model.Booking;
import com.rentit.model.Listing;
import com.rentit.model.enums.BookingStatus;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerAnalyticsService {

    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;

    public OwnerAnalyticsDTO getAnalytics(UUID ownerId) {
        List<Booking> bookings = bookingRepository.findByListingOwnerId(ownerId);
        List<Listing> listings = listingRepository.findByOwnerId(ownerId);

        long totalBookings = bookings.size();
        long confirmed = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.CONFIRMED || b.getBookingStatus() == BookingStatus.COMPLETED || b.getBookingStatus() == BookingStatus.IN_USE)
                .count();
        long pending = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.PENDING_PAYMENT)
                .count();
        long rejected = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.CANCELLED || b.getBookingStatus() == BookingStatus.NO_SHOW)
                .count();

        BigDecimal totalRevenue = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.COMPLETED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingRevenue = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.CONFIRMED || b.getBookingStatus() == BookingStatus.IN_USE || b.getBookingStatus() == BookingStatus.RETURNED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageBookingValue = totalBookings > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalBookings), 2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;

        List<RecentBookingDTO> recentBookings = bookings.stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .limit(5)
                .map(this::mapToRecentBooking)
                .collect(Collectors.toList());

        List<RevenuePointDTO> revenueTrend = getRevenueTrend(ownerId, 6);

        return OwnerAnalyticsDTO.builder()
                .totalRevenue(totalRevenue)
                .pendingRevenue(pendingRevenue)
                .totalBookings(totalBookings)
                .confirmedBookings(confirmed)
                .pendingBookings(pending)
                .rejectedBookings(rejected)
                .completionRate(totalBookings > 0 ? (double) confirmed / totalBookings * 100 : 0)
                .activeListings(listings.stream().filter(l -> l.getIsPublished() && l.getIsAvailable()).count())
                .totalListings(listings.size())
                .averageBookingValue(averageBookingValue)
                .recentBookings(recentBookings)
                .revenueChart(revenueTrend)
                .build();
    }

    public List<RevenuePointDTO> getRevenueTrend(UUID ownerId, int months) {
        LocalDateTime start = LocalDateTime.now().minusMonths(months);
        List<Booking> bookings = bookingRepository.findByOwnerIdAndCreatedAtBetween(ownerId, start, LocalDateTime.now());

        Map<String, BigDecimal> monthlyRevenue = bookings.stream()
                .filter(b -> b.getBookingStatus() == BookingStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        b -> b.getUpdatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.reducing(BigDecimal.ZERO, Booking::getTotalAmount, BigDecimal::add)
                ));

        return monthlyRevenue.entrySet().stream()
                .map(e -> new RevenuePointDTO(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(RevenuePointDTO::getMonth))
                .collect(Collectors.toList());
    }

    private RecentBookingDTO mapToRecentBooking(Booking booking) {
        return RecentBookingDTO.builder()
                .id(booking.getId())
                .listingTitle(booking.getListing().getTitle())
                .renterName(booking.getRenter().getFullName())
                .amount(booking.getTotalAmount())
                .status(booking.getBookingStatus().name())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
