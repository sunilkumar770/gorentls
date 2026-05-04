package com.rentit.service;

import com.rentit.dto.*;
import com.rentit.dto.UserPublicResponse;
import com.rentit.model.*;
import com.rentit.model.enums.BookingStatus;
import com.rentit.exception.BusinessException;
import com.rentit.repository.*;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class AdminService {

        private final UserRepository userRepository;
        private final UserProfileRepository userProfileRepository;
        private final BusinessOwnerRepository businessOwnerRepository;
        private final AdminUserRepository adminUserRepository;
        private final ListingRepository listingRepository;
        private final BookingRepository bookingRepository;
        private final PaymentRepository paymentRepository;
        private final NotificationService notificationService;
        private final AdminAuditLogRepository auditLogRepository;

        // ── Helpers ──────────────────────────────────────────────────────────────

        /**
         * Converts a raw search term into a SQL LIKE pattern.
         * Empty/blank → "%%" which matches everything.
         */
        private String likePattern(String search) {
                if (search == null || search.isBlank()) return "%%";
                return "%" + search.trim() + "%";
        }

        private void logAction(String action, String entityType, String entityId, String description) {
                try {
                        AdminAuditLog log = new AdminAuditLog();
                        log.setAction(action);
                        log.setEntityType(entityType);
                        if (entityId != null) {
                                log.setEntityId(UUID.fromString(entityId));
                        }
                        log.setDescription(description);
                        // In production, we'd pull this from SecurityContextHolder
                        log.setAdminEmail("admin@gorentals.com"); 
                        auditLogRepository.save(log);
                } catch (Exception e) {
                        // Log locally but don't break the UI flow if DB audit fails
                }
        }

        // ── Dashboard ─────────────────────────────────────────────────────────────
        @Transactional(readOnly = true)
        public AdminDashboardStats getDashboardStats() {
                long totalUsers = userRepository.count();
                long totalOwners = userRepository.countOwners();
                long totalRenters = userRepository.countRenters();

                long totalListings = listingRepository.count();
                long activeListings = listingRepository.countByIsPublishedTrueAndIsAvailableTrue();
                long pendingListings = listingRepository.countByIsPublishedFalse();

                long totalBookings = bookingRepository.count();
                long activeBookings = bookingRepository.countByBookingStatus(BookingStatus.CONFIRMED);
                long completedBookings = bookingRepository.countByBookingStatus(BookingStatus.COMPLETED);

                BigDecimal totalRevenue = paymentRepository.sumCompletedPayments();
                if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

                BigDecimal platformCommission = totalRevenue.multiply(new BigDecimal("0.10"));

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

        // ── Users ─────────────────────────────────────────────────────────────────

        /**
         * Returns all users, or filters by search term across email / fullName / phone.
         */
        @Transactional(readOnly = true)
        public Page<UserResponse> getUsers(Pageable pageable, String search) {
                return userRepository.searchAll(likePattern(search), pageable)
                                     .map(this::mapToUserResponse);
        }

        /** Legacy no-search overload — delegates to getUsers with empty search */
        @Transactional(readOnly = true)
        public Page<UserResponse> getAllUsers(Pageable pageable) {
                return getUsers(pageable, "");
        }

        // ── Owners ────────────────────────────────────────────────────────────────

        /**
         * Returns owner-type users, optionally filtered by search term.
         */
        @Transactional(readOnly = true)
        public Page<UserResponse> getOwners(Pageable pageable, String search) {
                return userRepository.searchByUserType(likePattern(search), User.UserType.OWNER, pageable)
                                     .map(this::mapToUserResponse);
        }

        /** Legacy no-search overload */
        @Transactional(readOnly = true)
        public Page<BusinessOwnerResponse> getAllOwners(Pageable pageable) {
                return businessOwnerRepository.findAll(pageable)
                                              .map(this::mapToBusinessOwnerResponse);
        }

        // ── Verification ──────────────────────────────────────────────────────────

        @Transactional
        public UserResponse verifyUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("User", userId));

                UserProfile profile = userProfileRepository.findByUserId(userId)
                                .orElseGet(() -> {
                                        UserProfile newProfile = new UserProfile();
                                        newProfile.setUser(user);
                                        return newProfile;
                                });

                profile.setKycStatus(UserProfile.KYCStatus.APPROVED);
                profile.setKycRejectionReason(null); // Clear any previous rejection reason
                userProfileRepository.save(profile);

                logAction("VERIFY_USER_KYC", "USER", userId.toString(), "KYC Approved manually");

                return mapToUserResponse(user);
        }

        @Transactional
        public UserResponse rejectUserKYC(UUID userId, String reason) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("User", userId));

                UserProfile profile = userProfileRepository.findByUserId(userId)
                                .orElseThrow(() -> BusinessException.notFound("Profile", userId));

                profile.setKycStatus(UserProfile.KYCStatus.REJECTED);
                profile.setKycRejectionReason(reason);
                userProfileRepository.save(profile);
                
                notificationService.sendNotification(
                    userId,
                    "KYC Rejected",
                    "Your identity verification was not approved. Reason: " + reason,
                    "KYC_REJECTED"
                );

                logAction("REJECT_USER_KYC", "USER", userId.toString(), "KYC Rejected. Reason: " + reason);

                return mapToUserResponse(user);
        }

        @Transactional(readOnly = true)
        public Page<UserResponse> getPendingKYCUsers(Pageable pageable) {
                return userProfileRepository.findByKycStatus(UserProfile.KYCStatus.SUBMITTED, pageable)
                                .map(profile -> mapToUserResponse(profile.getUser()));
        }

        @Transactional
        public BusinessOwnerResponse verifyBusinessOwner(UUID ownerId) {
                BusinessOwner owner = businessOwnerRepository.findById(ownerId)
                                .orElseThrow(() -> BusinessException.notFound("Business owner", ownerId));

                owner.setIsVerified(true);
                businessOwnerRepository.save(owner);

                UserProfile profile = userProfileRepository.findByUserId(owner.getUser().getId()).orElse(null);
                if (profile != null && profile.getKycStatus() != UserProfile.KYCStatus.APPROVED) {
                        profile.setKycStatus(UserProfile.KYCStatus.APPROVED);
                        userProfileRepository.save(profile);
                }

                logAction("VERIFY_BUSINESS_OWNER", "BUSINESS_OWNER", ownerId.toString(), "Owner verified manually");

                return mapToBusinessOwnerResponse(owner);
        }

        // ── Suspend / Restore ─────────────────────────────────────────────────────

        @Transactional
        public UserResponse suspendUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("User", userId));
                user.setIsActive(false);
                userRepository.save(user);
                return mapToUserResponse(user);
        }

        @Transactional
        public UserResponse unsuspendUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("User", userId));
                user.setIsActive(true);
                userRepository.save(user);
                return mapToUserResponse(user);
        }

        // ── Listings ──────────────────────────────────────────────────────────────

        @Transactional(readOnly = true)
        public Page<ListingResponse> getPendingListings(Pageable pageable) {
                return listingRepository.findByIsPublishedFalse(pageable)
                                        .map(this::mapToListingResponse);
        }

        @Transactional(readOnly = true)
        public Page<ListingResponse> getAllListings(Pageable pageable) {
                return listingRepository.findAll(pageable).map(this::mapToListingResponse);
        }

        @Transactional
        public ListingResponse approveListing(UUID listingId) {
                Listing listing = listingRepository.findById(listingId)
                                .orElseThrow(() -> BusinessException.notFound("Listing", listingId));

                listing.setIsPublished(true);
                listing.setUpdatedAt(LocalDateTime.now());
                listingRepository.save(listing);

                notificationService.sendNotification(
                    listing.getOwner().getId(),
                    "Listing Approved",
                    "Your listing \"" + listing.getTitle() + "\" has been approved and is now live.",
                    "LISTING_APPROVED"
                );

                logAction("APPROVE_LISTING", "LISTING", listingId.toString(), "Listing approved: " + listing.getTitle());

                return mapToListingResponse(listing);
        }

        @Transactional
        public void rejectListing(UUID listingId) {
                Listing listing = listingRepository.findById(listingId)
                                .orElseThrow(() -> BusinessException.notFound("Listing", listingId));

                // Soft delete — deactivate; preserves FK integrity
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

                logAction("REJECT_LISTING", "LISTING", listingId.toString(), "Listing rejected: " + listing.getTitle());
        }

        // ── Bookings / Transactions ───────────────────────────────────────────────

        @Transactional(readOnly = true)
        public Page<BookingResponse> getAllBookings(Pageable pageable) {
                return bookingRepository.findAll(pageable).map(this::mapToBookingResponse);
        }

        @Transactional(readOnly = true)
        public Page<TransactionResponse> getAllTransactions(Pageable pageable) {
                return paymentRepository.findAll(pageable).map(this::mapToTransactionResponse);
        }

        // ── Analytics ─────────────────────────────────────────────────────────────



        // ── DTO Mappers ───────────────────────────────────────────────────────────

        private UserResponse mapToUserResponse(User user) {
                UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
                boolean isVerified  = profile != null && profile.getKycStatus() == UserProfile.KYCStatus.APPROVED;

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
                                .kycDocumentUrl(profile != null ? profile.getKycDocumentUrl() : null)
                                .kycRejectionReason(profile != null ? profile.getKycRejectionReason() : null)
                                .createdAt(user.getCreatedAt())
                                .build();
        }

        private UserPublicResponse mapToUserPublicResponse(User user) {
                UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
                boolean isVerified  = profile != null && profile.getKycStatus() == UserProfile.KYCStatus.APPROVED;

                return UserPublicResponse.builder()
                                .id(user.getId())
                                .fullName(user.getFullName())
                                .isVerified(isVerified)
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
                                .owner(mapToUserPublicResponse(listing.getOwner()))
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
                User owner  = booking.getListing().getOwner();
                return BookingResponse.builder()
                                .id(booking.getId())
                                .listing(ListingResponse.builder()
                                                .id(booking.getListing().getId())
                                                .title(booking.getListing().getTitle())
                                                .pricePerDay(booking.getListing().getPricePerDay())
                                                .images(booking.getListing().getImages())
                                                .build())
                                .renter(UserPublicResponse.builder()
                                                .id(renter.getId()).fullName(renter.getFullName())
                                                .isVerified(false) // Admin view logic can be expanded
                                                .build())
                                .owner(UserPublicResponse.builder()
                                                .id(owner.getId()).fullName(owner.getFullName())
                                                .isVerified(true)
                                                .build())
                                .startDate(booking.getStartDate())
                                .endDate(booking.getEndDate())
                                .totalDays(booking.getTotalDays())
                                .rentalAmount(booking.getRentalAmount())
                                .securityDeposit(booking.getSecurityDeposit())
                                .totalAmount(booking.getTotalAmount())
                                .status(booking.getBookingStatus().name())
                                .paymentStatus(booking.getPaymentStatus())
                                .razorpayOrderId(booking.getRazorpayOrderId())
                                .razorpayPaymentId(booking.getRazorpayPaymentId())
                                .createdAt(booking.getCreatedAt())
                                .updatedAt(booking.getUpdatedAt())
                                .build();
        }
}
