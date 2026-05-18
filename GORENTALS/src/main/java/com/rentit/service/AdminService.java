package com.rentit.service;

import com.rentit.dto.*;
import com.rentit.dto.UserPublicResponse;
import com.rentit.model.*;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.PayoutStatus;
import com.rentit.model.enums.PayoutOnboardingStatus;
import com.rentit.model.enums.LedgerAccount;
import com.rentit.exception.BusinessException;
import com.rentit.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.rentit.security.AuditLog;

@Service
@RequiredArgsConstructor
public class AdminService {

        private final UserRepository userRepository;
        private final UserProfileRepository userProfileRepository;
        private final BusinessOwnerRepository businessOwnerRepository;
        private final ListingRepository listingRepository;
        private final BookingRepository bookingRepository;
        private final PaymentRepository paymentRepository;
        private final NotificationService notificationService;
        private final AuditService auditService;
        private final LedgerService ledgerService;
        private final PayoutRepository payoutRepository;
        private final LedgerTransactionRepository ledgerTransactionRepository;
        private final OwnerPayoutAccountRepository ownerPayoutAccountRepository;

        private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

        // ── Helpers ──────────────────────────────────────────────────────────────

        /**
         * Converts a raw search term into a SQL LIKE pattern.
         * Empty/blank → "%%" which matches everything.
         */
        private String likePattern(String search) {
                if (search == null || search.isBlank()) return "%%";
                // Escape % and _ to prevent malformed LIKE queries
                String escaped = search.trim()
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_");
                return "%" + escaped + "%";
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

                // Accurate platform commission from ledger history
                BigDecimal platformCommission = ledgerService.platformFeeRevenue(
                    LocalDateTime.now().minusYears(10).atZone(java.time.ZoneId.systemDefault()).toInstant(), 
                    LocalDateTime.now().atZone(java.time.ZoneId.systemDefault()).toInstant()
                );

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
        @AuditLog(action = "VERIFY_USER_KYC", entityType = "USER")
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

                return mapToUserResponse(user);
        }

        @Transactional
        @AuditLog(action = "REJECT_USER_KYC", entityType = "USER")
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

                return mapToUserResponse(user);
        }

        @Transactional(readOnly = true)
        public Page<UserResponse> getPendingKYCUsers(Pageable pageable) {
                return userProfileRepository.findByKycStatus(UserProfile.KYCStatus.SUBMITTED, pageable)
                                .map(profile -> mapToUserResponse(profile.getUser()));
        }

        @Transactional
        @AuditLog(action = "VERIFY_BUSINESS_OWNER", entityType = "BUSINESS_OWNER")
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

                return mapToBusinessOwnerResponse(owner);
        }

        // ── Suspend / Restore ─────────────────────────────────────────────────────

        @Transactional
        @AuditLog(action = "SUSPEND_USER", entityType = "USER")
        public UserResponse suspendUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("User", userId));
                user.setIsActive(false);
                userRepository.save(user);
                return mapToUserResponse(user);
        }

        @Transactional
        @AuditLog(action = "UNSUSPEND_USER", entityType = "USER")
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
        @AuditLog(action = "APPROVE_LISTING", entityType = "LISTING")
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

                return mapToListingResponse(listing);
        }

        @Transactional
        @AuditLog(action = "REJECT_LISTING", entityType = "LISTING")
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

        @Transactional(readOnly = true)
        public Page<AdminAuditLog> getAuditLogs(Pageable pageable) {
                // Now using AuditService conceptually, but repo is still needed for direct fetch
                return auditService.getAuditLogs(pageable);
        }

        @Transactional
        @AuditLog(action = "DELETE_USER", entityType = "USER")
        public void deleteUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> BusinessException.notFound("User", userId));

                // 1. Identify active booking statuses
                List<BookingStatus> activeStatuses = List.of(
                        BookingStatus.PENDING,
                        BookingStatus.PENDING_PAYMENT,
                        BookingStatus.CONFIRMED,
                        BookingStatus.IN_USE,
                        BookingStatus.RETURNED,
                        BookingStatus.DISPUTED
                );

                // Check active bookings where user is renter
                long activeRenterBookings = bookingRepository.countByRenterIdAndBookingStatusIn(userId, activeStatuses);
                if (activeRenterBookings > 0) {
                        throw new BusinessException("Cannot delete user. They have active bookings as a renter.", "ACTIVE_RENTER_BOOKINGS");
                }

                // Check active bookings where user is owner
                long activeOwnerBookings = bookingRepository.countByOwnerIdAndBookingStatusIn(userId, activeStatuses);
                if (activeOwnerBookings > 0) {
                        throw new BusinessException("Cannot delete user. Their listings have active bookings.", "ACTIVE_OWNER_BOOKINGS");
                }

                // 2. Check if user has historical bookings or listings
                boolean hasHistoricalRenterBookings = bookingRepository.findByRenterId(userId, Pageable.unpaged()).getTotalElements() > 0;
                boolean hasHistoricalOwnerBookings = bookingRepository.findByOwnerId(userId, Pageable.unpaged()).getTotalElements() > 0;
                boolean hasHistoricalListings = listingRepository.findByOwnerId(userId).size() > 0;

                if (hasHistoricalRenterBookings || hasHistoricalOwnerBookings || hasHistoricalListings) {
                        // Soft delete / anonymize user to protect transaction history & audit logs (GDPR-style right to be forgotten)
                        user.setIsActive(false);
                        user.setFullName("Deleted User (" + userId.toString().substring(0, 8) + ")");
                        user.setEmail("deleted_" + userId + "@gorentals.com");
                        user.setPhone(null);
                        user.setPasswordHash(null);
                        user.setResetToken(null);
                        user.setResetTokenExpiry(null);

                        UserProfile profile = user.getProfile();
                        if (profile != null) {
                                profile.setProfilePicture(null);
                                profile.setDateOfBirth(null);
                                profile.setAddress(null);
                                profile.setCity(null);
                                profile.setState(null);
                                profile.setPincode(null);
                                profile.setKycStatus(UserProfile.KYCStatus.REJECTED);
                                profile.setKycDocumentType(null);
                                profile.setKycDocumentId(null);
                                profile.setKycDocumentUrl(null);
                                profile.setKycRejectionReason("User deleted/anonymized");
                                userProfileRepository.save(profile);
                        }
                        
                        // Also deactivate any listings the user owns
                        List<Listing> listings = listingRepository.findByOwnerId(userId);
                        for (Listing listing : listings) {
                                listing.setIsPublished(false);
                                listing.setIsAvailable(false);
                                listing.setDescription("Owner account deleted/anonymized");
                                listingRepository.save(listing);
                        }

                        userRepository.save(user);
                } else {
                        // Safe to hard delete because they have absolutely no historical footprints
                        userRepository.delete(user);
                }
        }

        @Transactional
        @AuditLog(action = "DELETE_LISTING", entityType = "LISTING")
        public void deleteListing(UUID listingId) {
                Listing listing = listingRepository.findById(listingId)
                                .orElseThrow(() -> BusinessException.notFound("Listing", listingId));

                // 1. Check for active/pending bookings
                List<BookingStatus> activeStatuses = List.of(
                        BookingStatus.PENDING,
                        BookingStatus.PENDING_PAYMENT,
                        BookingStatus.CONFIRMED,
                        BookingStatus.IN_USE,
                        BookingStatus.RETURNED,
                        BookingStatus.DISPUTED
                );

                // Find bookings by listing ID
                Page<Booking> bookingsPage = bookingRepository.findByListingId(listingId, Pageable.unpaged());
                List<Booking> bookings = bookingsPage.getContent();
                
                boolean hasActiveBookings = bookings.stream()
                                .anyMatch(b -> activeStatuses.contains(b.getBookingStatus()));

                if (hasActiveBookings) {
                        throw new BusinessException("Cannot delete listing with active bookings. Cancel or complete them first.", "ACTIVE_LISTING_BOOKINGS");
                }

                // 2. Check if listing has historical bookings
                boolean hasHistoricalBookings = !bookings.isEmpty();

                if (hasHistoricalBookings) {
                        // Soft delete listing by making it completely unpublished/unavailable and clearing specifications/images
                        listing.setIsPublished(false);
                        listing.setIsAvailable(false);
                        listing.setTitle("Deleted Listing (" + listingId.toString().substring(0, 8) + ")");
                        listing.setDescription("This listing has been deleted by an administrator.");
                        listing.setSpecifications(null);
                        listing.setImages(null);
                        listingRepository.save(listing);
                } else {
                        // Safe to hard delete as there is no historical footprint in bookings table
                        listingRepository.delete(listing);
                }
        }


        // ── DTO Mappers ───────────────────────────────────────────────────────────

        private UserResponse mapToUserResponse(User user) {
                UserProfile profile = user.getProfile();
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
                UserProfile profile = user.getProfile();
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

        // ── Payout Controls ───────────────────────────────────────────────────────

        @Transactional(readOnly = true)
        public Page<Payout> getPayouts(PayoutStatus status, UUID ownerId, Pageable pageable) {
                if (status != null && ownerId != null) {
                        return payoutRepository.findByStatusAndOwnerId(status, ownerId, pageable);
                } else if (status != null) {
                        return payoutRepository.findByStatus(status, pageable);
                } else if (ownerId != null) {
                        return payoutRepository.findByOwnerId(ownerId, pageable);
                } else {
                        return payoutRepository.findAll(pageable);
                }
        }

        @Transactional
        @AuditLog(action = "HOLD_PAYOUT", entityType = "PAYOUT")
        public Payout holdPayout(UUID payoutId) {
                Payout payout = payoutRepository.findByIdWithLock(payoutId)
                                .orElseThrow(() -> BusinessException.notFound("Payout", payoutId));
                payout.putOnHold();
                return payoutRepository.save(payout);
        }

        @Transactional
        @AuditLog(action = "RELEASE_PAYOUT", entityType = "PAYOUT")
        public Payout releasePayout(UUID payoutId) {
                Payout payout = payoutRepository.findByIdWithLock(payoutId)
                                .orElseThrow(() -> BusinessException.notFound("Payout", payoutId));
                if (payout.getStatus() != PayoutStatus.ON_HOLD) {
                        throw new BusinessException("Only ON_HOLD payouts can be released.", "INVALID_PAYOUT_STATE");
                }
                payout.releaseHold();
                return payoutRepository.save(payout);
        }

        @Transactional
        @AuditLog(action = "FORCE_SUCCESS_PAYOUT", entityType = "PAYOUT")
        public Payout forceSuccessPayout(UUID payoutId) {
                Payout payout = payoutRepository.findByIdWithLock(payoutId)
                                .orElseThrow(() -> BusinessException.notFound("Payout", payoutId));
                payout.forceSuccess();
                return payoutRepository.save(payout);
        }

        @Transactional
        @AuditLog(action = "FORCE_FAILED_PAYOUT", entityType = "PAYOUT")
        public Payout forceFailedPayout(UUID payoutId, String reason) {
                Payout payout = payoutRepository.findByIdWithLock(payoutId)
                                .orElseThrow(() -> BusinessException.notFound("Payout", payoutId));
                payout.forceFailed(reason != null ? reason : "Manually failed by admin");
                return payoutRepository.save(payout);
        }

        // ── Ledger Controls ────────────────────────────────────────────────────────

        @Transactional(readOnly = true)
        public Page<LedgerTransaction> getLedgerTransactions(LedgerAccount account, Pageable pageable) {
                if (account != null) {
                        return ledgerTransactionRepository.findByAccount(account, pageable);
                }
                return ledgerTransactionRepository.findAll(pageable);
        }

        @Transactional(readOnly = true)
        public Page<LedgerTransaction> getLedgerTransactionsForBooking(UUID bookingId, Pageable pageable) {
                return ledgerTransactionRepository.findByBookingId(bookingId, pageable);
        }

        @Transactional(readOnly = true)
        public List<LedgerTransaction> getLedgerTransactionsForBookingList(UUID bookingId) {
                return ledgerTransactionRepository.findByBookingIdOrderByCreatedAtAsc(bookingId);
        }

        // ── Owner Payout Account Controls ──────────────────────────────────────────

        @Transactional(readOnly = true)
        public Page<OwnerPayoutAccount> getOwnerPayoutAccounts(PayoutOnboardingStatus status, Pageable pageable) {
                if (status != null) {
                        return ownerPayoutAccountRepository.findByStatus(status, pageable);
                }
                return ownerPayoutAccountRepository.findAll(pageable);
        }

        @Transactional
        @AuditLog(action = "VERIFY_PAYOUT_ACCOUNT", entityType = "OWNER_PAYOUT_ACCOUNT")
        public OwnerPayoutAccount verifyOwnerPayoutAccount(UUID accountId, String fundAccountId, String verificationRef) {
                OwnerPayoutAccount account = ownerPayoutAccountRepository.findById(accountId)
                                .orElseThrow(() -> BusinessException.notFound("OwnerPayoutAccount", accountId));
                account.verify(fundAccountId != null ? fundAccountId : "fa_mock_admin_verify", verificationRef != null ? verificationRef : "ref_admin_manual");
                return ownerPayoutAccountRepository.save(account);
        }

        @Transactional
        @AuditLog(action = "SUSPEND_PAYOUT_ACCOUNT", entityType = "OWNER_PAYOUT_ACCOUNT")
        public OwnerPayoutAccount suspendOwnerPayoutAccount(UUID accountId) {
                OwnerPayoutAccount account = ownerPayoutAccountRepository.findById(accountId)
                                .orElseThrow(() -> BusinessException.notFound("OwnerPayoutAccount", accountId));
                account.suspend();
                
                // Compliance Cascade: place pending and initiated payouts on hold
                List<Payout> pendingPayouts = payoutRepository.findByOwnerIdAndStatusIn(
                        account.getOwnerId(),
                        List.of(PayoutStatus.PENDING, PayoutStatus.INITIATED)
                );
                if (!pendingPayouts.isEmpty()) {
                        logger.warn("[COMPLIANCE CASCADE] Automatically placing {} payouts on hold for suspended owner account ID: {} (Owner ID: {})",
                                pendingPayouts.size(), accountId, account.getOwnerId());
                        for (Payout payout : pendingPayouts) {
                                payout.putOnHold();
                                payoutRepository.save(payout);
                        }
                }
                
                return ownerPayoutAccountRepository.save(account);
        }

        @Transactional
        @AuditLog(action = "BLOCK_PAYOUT_ACCOUNT", entityType = "OWNER_PAYOUT_ACCOUNT")
        public OwnerPayoutAccount blockOwnerPayoutAccount(UUID accountId) {
                OwnerPayoutAccount account = ownerPayoutAccountRepository.findById(accountId)
                                .orElseThrow(() -> BusinessException.notFound("OwnerPayoutAccount", accountId));
                account.block();
                
                // Compliance Cascade: place pending and initiated payouts on hold
                List<Payout> pendingPayouts = payoutRepository.findByOwnerIdAndStatusIn(
                        account.getOwnerId(),
                        List.of(PayoutStatus.PENDING, PayoutStatus.INITIATED)
                );
                if (!pendingPayouts.isEmpty()) {
                        logger.warn("[COMPLIANCE CASCADE] Automatically placing {} payouts on hold for blocked owner account ID: {} (Owner ID: {})",
                                pendingPayouts.size(), accountId, account.getOwnerId());
                        for (Payout payout : pendingPayouts) {
                                payout.putOnHold();
                                payoutRepository.save(payout);
                        }
                }
                
                return ownerPayoutAccountRepository.save(account);
        }

        @Transactional
        @AuditLog(action = "REINSTATE_PAYOUT_ACCOUNT", entityType = "OWNER_PAYOUT_ACCOUNT")
        public OwnerPayoutAccount reinstateOwnerPayoutAccount(UUID accountId, String freshVerificationRef) {
                OwnerPayoutAccount account = ownerPayoutAccountRepository.findById(accountId)
                                .orElseThrow(() -> BusinessException.notFound("OwnerPayoutAccount", accountId));
                account.reinstate(freshVerificationRef != null ? freshVerificationRef : "ref_admin_reinstate");
                return ownerPayoutAccountRepository.save(account);
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
