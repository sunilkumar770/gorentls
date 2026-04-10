package com.rentit.service;

import com.rentit.dto.*;
import com.rentit.model.*;
import com.rentit.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private UserProfileRepository userProfileRepository;

        @Autowired
        private BusinessOwnerRepository businessOwnerRepository;

        @Autowired
        private AdminUserRepository adminUserRepository;

        @Autowired
        private ListingRepository listingRepository;

        @Autowired
        private BookingRepository bookingRepository;

        @Autowired
        private PaymentRepository paymentRepository;

        @Autowired
        private NotificationService notificationService;

        /**
         * Get admin dashboard statistics
         */
        public AdminDashboardStats getDashboardStats() {
                long totalUsers = userRepository.count();
                long totalOwners = userRepository.countOwners();
                long totalRenters = userRepository.countRenters();

                long totalListings = listingRepository.count();
                long activeListings = listingRepository.countByIsPublishedTrueAndIsAvailableTrue();
                long pendingListings = listingRepository.countByIsPublishedFalse();

                long totalBookings = bookingRepository.count();
                long activeBookings = bookingRepository.countByStatus(Booking.BookingStatus.CONFIRMED);
                long completedBookings = bookingRepository.countByStatus(Booking.BookingStatus.COMPLETED);

                BigDecimal totalRevenue = paymentRepository.sumCompletedPayments();
                if (totalRevenue == null)
                        totalRevenue = BigDecimal.ZERO;

                BigDecimal platformCommission = totalRevenue.multiply(new BigDecimal("0.10")); // 10% commission

                long pendingKYC = userProfileRepository.countByKycStatus(UserProfile.KYCStatus.PENDING);
                long pendingOwnerVerifications = businessOwnerRepository.countByIsVerifiedFalse();

                return AdminDashboardStats.builder()
                                .totalUsers(totalUsers)
                                .totalOwners(totalOwners)
                                .totalRenters(totalRenters)
                                .totalListings(totalListings)
                                .activeListings(activeListings)
                                .pendingListings(pendingListings)
                                .totalBookings(totalBookings)
                                .activeBookings(activeBookings)
                                .completedBookings(completedBookings)
                                .totalRevenue(totalRevenue)
                                .platformCommission(platformCommission)
                                .pendingKYC(pendingKYC)
                                .pendingOwnerVerifications(pendingOwnerVerifications)
                                .build();
        }

        /**
         * Get all users with pagination
         */
        public Page<UserResponse> getAllUsers(Pageable pageable) {
                Page<User> users = userRepository.findAll(pageable);
                return users.map(this::mapToUserResponse);
        }

        /**
         * Get all business owners with pagination
         */
        public Page<BusinessOwnerResponse> getAllOwners(Pageable pageable) {
                Page<BusinessOwner> owners = businessOwnerRepository.findAll(pageable);
                return owners.map(this::mapToBusinessOwnerResponse);
        }

        /**
         * Verify a user
         */
        @Transactional
        public UserResponse verifyUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                UserProfile profile = userProfileRepository.findByUserId(userId)
                                .orElseGet(() -> {
                                        UserProfile newProfile = new UserProfile();
                                        newProfile.setUser(user);
                                        return newProfile;
                                });

                profile.setKycStatus(UserProfile.KYCStatus.APPROVED);
                userProfileRepository.save(profile);

                return mapToUserResponse(user);
        }

        /**
         * Verify a business owner
         */
        @Transactional
        public BusinessOwnerResponse verifyBusinessOwner(UUID ownerId) {
                BusinessOwner owner = businessOwnerRepository.findById(ownerId)
                                .orElseThrow(() -> new RuntimeException("Business owner not found"));

                owner.setIsVerified(true);
                businessOwnerRepository.save(owner);

                // Also verify the user's KYC if not already verified
                UserProfile profile = userProfileRepository.findByUserId(owner.getUser().getId())
                                .orElse(null);
                if (profile != null && profile.getKycStatus() != UserProfile.KYCStatus.APPROVED) {
                        profile.setKycStatus(UserProfile.KYCStatus.APPROVED);
                        userProfileRepository.save(profile);
                }

                return mapToBusinessOwnerResponse(owner);
        }

        /**
         * Get pending listings for admin approval
         */
        public Page<ListingResponse> getPendingListings(Pageable pageable) {
                Page<Listing> listings = listingRepository.findByIsPublishedFalse(pageable);
                return listings.map(this::mapToListingResponse);
        }

        /**
         * Approve a listing
         */
        @Transactional
        public ListingResponse approveListing(UUID listingId) {
                Listing listing = listingRepository.findById(listingId)
                                .orElseThrow(() -> new RuntimeException("Listing not found"));

                listing.setIsPublished(true);
                listing.setUpdatedAt(LocalDateTime.now());
                listingRepository.save(listing);

                notificationService.sendNotification(
                    listing.getOwner().getId(),
                    "Listing Approved",
                    "Your listing \"" + listing.getTitle() + "\" has been approved and is now live.",
                    "LISTING_APPROVED"
                );

                return mapToListingResponse(listing);
        }

        /**
         * Reject a listing (delete it)
         */
        @Transactional
        public void rejectListing(UUID listingId) {
                Listing listing = listingRepository.findById(listingId)
                                .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

                // Soft delete — deactivate, don't delete. Preserves FK integrity.
                listing.setIsPublished(false);
                listing.setIsAvailable(false);
                listing.setUpdatedAt(LocalDateTime.now());
                listingRepository.save(listing);

                notificationService.sendNotification(
                    listing.getOwner().getId(),
                    "Listing Rejected",
                    "Your listing \"" + listing.getTitle() + "\" was not approved. Please review and resubmit.",
                    "LISTING_REJECTED"
                );
        }

        /**
         * Get all transactions with pagination
         */
        public Page<TransactionResponse> getAllTransactions(Pageable pageable) {
                Page<Payment> payments = paymentRepository.findAll(pageable);
                return payments.map(this::mapToTransactionResponse);
        }

        /**
         * Get platform analytics for date range
         */
        public PlatformAnalytics getPlatformAnalytics(String startDate, String endDate) {
                LocalDateTime start = LocalDate.parse(startDate).atStartOfDay();
                LocalDateTime end = LocalDate.parse(endDate).atTime(23, 59, 59);

                // User Statistics
                long totalUsers = userRepository.count();
                long totalOwners = userRepository.countOwners();
                long totalRenters = userRepository.countRenters();
                long newUsersThisMonth = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
                long newOwnersThisMonth = userRepository
                                .countOwnersByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
                long verifiedUsers = userProfileRepository.countByKycStatus(UserProfile.KYCStatus.APPROVED);

                PlatformAnalytics.UserStatistics userStats = PlatformAnalytics.UserStatistics.builder()
                                .totalUsers(totalUsers)
                                .totalOwners(totalOwners)
                                .totalRenters(totalRenters)
                                .newUsersThisMonth(newUsersThisMonth)
                                .newOwnersThisMonth(newOwnersThisMonth)
                                .verifiedUsers(verifiedUsers)
                                .build();

                // Booking Statistics
                long totalBookings = bookingRepository.count();
                long completedBookings = bookingRepository.countByStatus(Booking.BookingStatus.COMPLETED);
                long cancelledBookings = bookingRepository.countByStatus(Booking.BookingStatus.CANCELLED);
                long activeBookings = bookingRepository.countByStatus(Booking.BookingStatus.CONFIRMED);
                Double averageBookingValue = bookingRepository.getAverageBookingValue();
                Double averageRentalDays = bookingRepository.getAverageRentalDays();

                PlatformAnalytics.BookingStatistics bookingStats = PlatformAnalytics.BookingStatistics.builder()
                                .totalBookings(totalBookings)
                                .completedBookings(completedBookings)
                                .cancelledBookings(cancelledBookings)
                                .activeBookings(activeBookings)
                                .averageBookingValue(averageBookingValue != null ? averageBookingValue : 0.0)
                                .averageRentalDays(averageRentalDays != null ? averageRentalDays : 0.0)
                                .build();

                // Revenue Statistics
                BigDecimal totalRevenue = paymentRepository.sumCompletedPayments();
                if (totalRevenue == null)
                        totalRevenue = BigDecimal.ZERO;
                BigDecimal platformCommission = totalRevenue.multiply(new BigDecimal("0.10"));
                BigDecimal ownerPayouts = totalRevenue.subtract(platformCommission);
                BigDecimal monthlyRevenue = paymentRepository.sumPaymentsByDateRange(
                                LocalDateTime.now().minusMonths(1), LocalDateTime.now());
                BigDecimal weeklyRevenue = paymentRepository.sumPaymentsByDateRange(
                                LocalDateTime.now().minusWeeks(1), LocalDateTime.now());

                // Get revenue by month for last 6 months
                Map<String, BigDecimal> revenueByMonth = new LinkedHashMap<>();
                for (int i = 5; i >= 0; i--) {
                        LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).toLocalDate()
                                        .atStartOfDay();
                        LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
                        BigDecimal monthlyRev = paymentRepository.sumPaymentsByDateRange(monthStart, monthEnd);
                        if (monthlyRev == null)
                                monthlyRev = BigDecimal.ZERO;
                        revenueByMonth.put(monthStart.format(DateTimeFormatter.ofPattern("MMM yyyy")), monthlyRev);
                }

                PlatformAnalytics.RevenueStatistics revenueStats = PlatformAnalytics.RevenueStatistics.builder()
                                .totalRevenue(totalRevenue)
                                .platformCommission(platformCommission)
                                .ownerPayouts(ownerPayouts)
                                .monthlyRevenue(monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO)
                                .weeklyRevenue(weeklyRevenue != null ? weeklyRevenue : BigDecimal.ZERO)
                                .revenueByMonth(revenueByMonth)
                                .build();

                // Growth Statistics
                Long lastMonthUsers = userRepository.countByCreatedAtBefore(LocalDateTime.now().minusMonths(1));
                Double userGrowthRate = lastMonthUsers > 0
                                ? ((double) (totalUsers - lastMonthUsers) / lastMonthUsers) * 100
                                : 0;

                Long lastMonthBookings = bookingRepository.countByCreatedAtBefore(LocalDateTime.now().minusMonths(1));
                Double bookingGrowthRate = lastMonthBookings > 0
                                ? ((double) (totalBookings - lastMonthBookings) / lastMonthBookings) * 100
                                : 0;

                BigDecimal lastMonthRevenue = paymentRepository.sumPaymentsByDateRange(
                                LocalDateTime.now().minusMonths(2), LocalDateTime.now().minusMonths(1));
                Double revenueGrowthRate = lastMonthRevenue != null && lastMonthRevenue.compareTo(BigDecimal.ZERO) > 0
                                ? ((totalRevenue.doubleValue() - lastMonthRevenue.doubleValue())
                                                / lastMonthRevenue.doubleValue()) * 100
                                : 0;

                // Get monthly stats for chart
                List<PlatformAnalytics.MonthlyStat> monthlyStats = new ArrayList<>();
                for (int i = 5; i >= 0; i--) {
                        LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).toLocalDate()
                                        .atStartOfDay();
                        LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);

                        Long newUsers = userRepository.countByCreatedAtBetween(monthStart, monthEnd);
                        Long bookings = bookingRepository.countByCreatedAtBetween(monthStart, monthEnd);
                        BigDecimal revenue = paymentRepository.sumPaymentsByDateRange(monthStart, monthEnd);

                        monthlyStats.add(PlatformAnalytics.MonthlyStat.builder()
                                        .month(monthStart.format(DateTimeFormatter.ofPattern("MMM yyyy")))
                                        .newUsers(newUsers)
                                        .bookings(bookings)
                                        .revenue(revenue != null ? revenue : BigDecimal.ZERO)
                                        .build());
                }

                PlatformAnalytics.GrowthStatistics growthStats = PlatformAnalytics.GrowthStatistics.builder()
                                .userGrowthRate(userGrowthRate)
                                .bookingGrowthRate(bookingGrowthRate)
                                .revenueGrowthRate(revenueGrowthRate)
                                .monthlyStats(monthlyStats)
                                .build();

                // Top Categories
                List<Object[]> categoryStats = listingRepository.getTopCategories();
                List<PlatformAnalytics.CategoryStat> topCategories = categoryStats.stream()
                                .limit(5)
                                .map(stat -> PlatformAnalytics.CategoryStat.builder()
                                                .category((String) stat[0])
                                                .count(((Number) stat[1]).longValue())
                                                .totalValue((BigDecimal) stat[2])
                                                .build())
                                .collect(Collectors.toList());

                // Top Cities
                List<Object[]> cityStats = listingRepository.getTopCities();
                List<PlatformAnalytics.CityStat> topCities = cityStats.stream()
                                .limit(5)
                                .map(stat -> PlatformAnalytics.CityStat.builder()
                                                .city((String) stat[0])
                                                .listingCount(((Number) stat[1]).longValue())
                                                .bookingCount(((Number) stat[2]).longValue())
                                                .revenue((BigDecimal) stat[3])
                                                .build())
                                .collect(Collectors.toList());

                return PlatformAnalytics.builder()
                                .userStatistics(userStats)
                                .bookingStatistics(bookingStats)
                                .revenueStatistics(revenueStats)
                                .growthStatistics(growthStats)
                                .topCategories(topCategories)
                                .topCities(topCities)
                                .build();
        }
        public Page<ListingResponse> getAllListings(Pageable pageable) {
                return listingRepository.findAll(pageable).map(this::mapToListingResponse);
        }

        public Page<BookingResponse> getAllBookings(Pageable pageable) {
                return bookingRepository.findAll(pageable).map(this::mapToBookingResponse);
        }

        @Transactional
        public UserResponse suspendUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                user.setIsActive(false);
                userRepository.save(user);
                return mapToUserResponse(user);
        }

        @Transactional
        public UserResponse unsuspendUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                user.setIsActive(true);
                userRepository.save(user);
                return mapToUserResponse(user);
        }

        // Helper methods to map entities to DTOs

        private UserResponse mapToUserResponse(User user) {
                UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
                boolean isVerified = profile != null &&
                                profile.getKycStatus() == UserProfile.KYCStatus.APPROVED;

                return UserResponse.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .phone(user.getPhone())
                                .userType(user.getUserType().name())
                                .isActive(user.getIsActive())
                                .isVerified(isVerified)
                                .kycStatus(profile != null ? profile.getKycStatus().name() : "PENDING")
                                .kycDocumentType(profile != null ? profile.getKycDocumentType() : null)
                                .kycDocumentId(profile != null ? profile.getKycDocumentId() : null)
                                .createdAt(user.getCreatedAt())
                                .build();
        }

        private BusinessOwnerResponse mapToBusinessOwnerResponse(BusinessOwner owner) {
                return BusinessOwnerResponse.builder()
                                .id(owner.getId())
                                .user(mapToUserResponse(owner.getUser()))
                                .businessName(owner.getBusinessName())
                                .businessType(owner.getBusinessType())
                                .businessAddress(owner.getBusinessAddress())
                                .businessCity(owner.getBusinessCity())
                                .businessState(owner.getBusinessState())
                                .businessPincode(owner.getBusinessPincode())
                                .businessPhone(owner.getBusinessPhone())
                                .businessEmail(owner.getBusinessEmail())
                                .gstNumber(owner.getGstNumber())
                                .panNumber(owner.getPanNumber())
                                .registrationNumber(owner.getRegistrationNumber())
                                .isVerified(owner.getIsVerified())
                                .commissionRate(owner.getCommissionRate())
                                .createdAt(owner.getCreatedAt())
                                .build();
        }

        private ListingResponse mapToListingResponse(Listing listing) {
                return ListingResponse.builder()
                                .id(listing.getId())
                                .owner(mapToUserResponse(listing.getOwner()))
                                .title(listing.getTitle())
                                .description(listing.getDescription())
                                .category(listing.getCategory())
                                .type(listing.getType())
                                .pricePerDay(listing.getPricePerDay())
                                .securityDeposit(listing.getSecurityDeposit())
                                .location(listing.getLocation())
                                .city(listing.getCity())
                                .state(listing.getState())
                                .specifications(listing.getSpecifications())
                                .images(listing.getImages())
                                .isAvailable(listing.getIsAvailable())
                                .isPublished(listing.getIsPublished())
                                .totalRatings(listing.getTotalRatings())
                                .ratingCount(listing.getRatingCount())
                                .createdAt(listing.getCreatedAt())
                                .updatedAt(listing.getUpdatedAt())
                                .build();
        }

        private TransactionResponse mapToTransactionResponse(Payment payment) {
                Booking booking = payment.getBooking();
                Listing listing = booking.getListing();

                return TransactionResponse.builder()
                                .id(payment.getId())
                                .bookingId(booking.getId())
                                .bookingTitle(listing.getTitle())
                                .user(mapToUserResponse(booking.getRenter()))
                                .amount(payment.getAmount())
                                .paymentType(payment.getPaymentType())
                                .status(payment.getStatus())
                                .razorpayOrderId(payment.getRazorpayOrderId())
                                .razorpayPaymentId(payment.getRazorpayPaymentId())
                                .createdAt(payment.getCreatedAt())
                                .build();
        }

        private BookingResponse mapToBookingResponse(Booking booking) {
                User renter = booking.getRenter();
                User owner = booking.getListing().getOwner();

                return BookingResponse.builder()
                                .id(booking.getId())
                                .listing(ListingResponse.builder()
                                                .id(booking.getListing().getId())
                                                .title(booking.getListing().getTitle())
                                                .pricePerDay(booking.getListing().getPricePerDay())
                                                .images(booking.getListing().getImages())
                                                .build())
                                .renter(UserResponse.builder()
                                                .id(renter.getId())
                                                .fullName(renter.getFullName())
                                                .email(renter.getEmail())
                                                .phone(renter.getPhone())
                                                .build())
                                .owner(UserResponse.builder()
                                                .id(owner.getId())
                                                .fullName(owner.getFullName())
                                                .email(owner.getEmail())
                                                .phone(owner.getPhone())
                                                .build())
                                .startDate(booking.getStartDate())
                                .endDate(booking.getEndDate())
                                .totalDays(booking.getTotalDays())
                                .rentalAmount(booking.getRentalAmount())
                                .securityDeposit(booking.getSecurityDeposit())
                                .totalAmount(booking.getTotalAmount())
                                .status(booking.getStatus().name())
                                .paymentStatus(booking.getPaymentStatus())
                                .razorpayOrderId(booking.getRazorpayOrderId())
                                .razorpayPaymentId(booking.getRazorpayPaymentId())
                                .createdAt(booking.getCreatedAt())
                                .updatedAt(booking.getUpdatedAt())
                                .build();
        }
}