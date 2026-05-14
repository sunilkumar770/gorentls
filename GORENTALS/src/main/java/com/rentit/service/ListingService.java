package com.rentit.service;

import com.rentit.dto.AvailabilityResponse;
import com.rentit.dto.ListingRequest;
import com.rentit.dto.ListingResponse;
import com.rentit.dto.UserPublicResponse;
import com.rentit.dto.PagedResponse;
import com.rentit.exception.BusinessException;
import com.rentit.model.BlockedDate;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.Listing;
import com.rentit.model.User;
import com.rentit.model.UserProfile;
import com.rentit.repository.BlockedDateRepository;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.UserRepository;
import com.rentit.util.DtoMapper;
import com.rentit.util.SearchUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * BUG-20 FIX: updateListing() enforces the KYC gate on isPublished — owner
 *             cannot re-publish a listing if KYC is not APPROVED.
 * BUG-21 FIX: deleteListing() refuses to delete if any ACTIVE booking exists
 *             (PENDING_PAYMENT, CONFIRMED, IN_USE).
 * BUG-22 FIX: removed the duplicate updateAvailability(UUID, boolean, String)
 *             overload that had inconsistent error types. One method remains.
 * SEARCH FIX: searchListings() passes null-safe patterns to the corrected JPQL
 *             query in ListingRepository. The old cast(:param as string) IS NULL
 *             pattern has been replaced with standard :param IS NULL, eliminating
 *             the HTTP 500 on category/city/type filtered searches.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ListingService {

    /** Booking statuses that represent an active, in-flight rental. */
    private static final Set<BookingStatus> ACTIVE_BOOKING_STATUSES = EnumSet.of(
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_USE
    );

    private final ListingRepository  listingRepository;
    private final UserRepository     userRepository;
    private final BlockedDateRepository blockedDateRepository;
    private final BookingRepository  bookingRepository;
    private final NotificationService notificationService;

    private void assertKycApproved(User user) {
        boolean approved = user.getProfile() != null &&
            user.getProfile().getKycStatus() == UserProfile.KYCStatus.APPROVED;
        if (!approved) {
            throw BusinessException.badRequest(
                "Your identity verification (KYC) must be APPROVED before you can publish listings.",
                "KYC_NOT_APPROVED"
            );
        }
    }

    // ── Public browse ─────────────────────────────────────────────────────────

    public PagedResponse<ListingResponse> getAllListings(
            int page, int size, String city, String category, UUID ownerId) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        String normCity     = (city     == null || city.isEmpty())     ? null : city;
        String normCategory = (category == null || category.isEmpty()) ? null : category;

        if (normCity == null && normCategory == null && ownerId == null) {
            Page<Listing> listings =
                    listingRepository.findByIsPublishedTrueAndIsAvailableTrue(pageable);
            return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
        }
        return searchListings(normCity, normCategory, null, null, null, ownerId, null, pageable);
    }

    /**
     * Search listings with optional filters.
     */
    public PagedResponse<ListingResponse> searchListings(
            String city, String category, String type, 
            BigDecimal minPrice, BigDecimal maxPrice, 
            UUID ownerId, String keyword, Pageable pageable) {

        // Keyword search takes priority — uses dedicated JPQL method
        if (keyword != null && !keyword.isBlank()) {
            Page<Listing> listings = listingRepository.searchByKeyword(keyword.trim(), pageable);
            return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
        }
        
        // Normalize empty strings to null for standard :param IS NULL checks
        String normCity     = (city     == null || city.isEmpty())     ? null : city;
        String normCategory = (category == null || category.isEmpty()) ? null : category;
        String normType     = (type     == null || type.isEmpty())     ? null : type;

        // Optimization: If no filters, return top published listings
        if (normCity == null && normCategory == null && normType == null && 
            minPrice == null && maxPrice == null && ownerId == null) {
            Page<Listing> listings = listingRepository.findByIsPublishedTrueAndIsAvailableTrue(pageable);
            return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
        }

        // City uses LIKE, so we wrap in wildcards via SearchUtils
        String cityPattern = SearchUtils.likeContents(normCity);
        
        Page<Listing> listings = listingRepository.searchListings(
                cityPattern, normCategory, normType, minPrice, maxPrice, ownerId, pageable);
                
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    /**
     * Get listing by ID
     */
    public ListingResponse getListingById(UUID id) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> BusinessException.notFound("Listing", id));
        return DtoMapper.mapToListingResponse(listing);
    }

    /**
     * Create a new listing
     */
    @Transactional
    public ListingResponse createListing(ListingRequest request, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));

        if (owner.getUserType() != User.UserType.OWNER) {
            throw BusinessException.forbidden("Only owners can create listings");
        }
        
        // Create new listing
        Listing listing = new Listing();
        listing.setOwner(owner);
        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setCategory(request.getCategory());
        listing.setType(request.getType());
        listing.setPricePerDay(request.getPricePerDay());
        listing.setSecurityDeposit(request.getSecurityDeposit());
        listing.setLocation(request.getLocation());
        listing.setCity(request.getCity());
        listing.setState(request.getState());
        listing.setSpecifications(request.getSpecifications());
        listing.setImages(request.getImages());
        listing.setIsAvailable(request.getIsAvailable()  != null ? request.getIsAvailable()  : Boolean.TRUE);

        // KYC Guard: Set false by default, and assert approved if requested true
        boolean requestedPublish = request.getIsPublished() != null ? request.getIsPublished() : Boolean.FALSE;

        if (requestedPublish) {
            assertKycApproved(owner);
        }

        listing.setIsPublished(requestedPublish);

        listing.setTotalRatings(BigDecimal.ZERO);
        listing.setRatingCount(0);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());
        
        Listing savedListing = listingRepository.save(listing);
        
        return DtoMapper.mapToListingResponse(savedListing);
    }

    /**
     * Update an existing listing
     */
    /**
     * BUG-20 FIX: KYC gate enforced on update, not just on create.
     * Owner can only set isPublished=true if their KYC is APPROVED.
     */
    @Transactional
    public ListingResponse updateListing(UUID id, ListingRequest request, String userEmail) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> BusinessException.notFound("Listing", id));

        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));

        if (!listing.getOwner().getId().equals(user.getId()) && user.getUserType() != User.UserType.ADMIN) {
            throw BusinessException.forbidden("You are not authorized to update this listing");
        }

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setCategory(request.getCategory());
        listing.setType(request.getType());
        listing.setPricePerDay(request.getPricePerDay());
        listing.setSecurityDeposit(request.getSecurityDeposit());
        listing.setLocation(request.getLocation());
        listing.setCity(request.getCity());
        listing.setState(request.getState());
        listing.setSpecifications(request.getSpecifications());
        listing.setImages(request.getImages());
        if (request.getIsAvailable() != null) listing.setIsAvailable(request.getIsAvailable());
        
        if (request.getIsPublished() != null) {
            if (request.getIsPublished()) {
                assertKycApproved(user);
            }
            listing.setIsPublished(request.getIsPublished());
        }

        listing.setUpdatedAt(LocalDateTime.now());
        return DtoMapper.mapToListingResponse(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponse publishListing(UUID id, String userEmail) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> BusinessException.notFound("Listing", id));

        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));

        if (!listing.getOwner().getId().equals(user.getId())) {
            throw BusinessException.forbidden("You are not authorized to publish this listing");
        }

        assertKycApproved(user);

        if (listing.getTitle() == null || listing.getTitle().isEmpty()) {
            throw BusinessException.badRequest("Please add a title before publishing", "MISSING_TITLE");
        }
        if (listing.getPricePerDay() == null || listing.getPricePerDay().compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Please add a valid price before publishing", "INVALID_PRICE");
        }

        listing.setIsPublished(true);
        listing.setUpdatedAt(LocalDateTime.now());
        return DtoMapper.mapToListingResponse(listingRepository.save(listing));
    }

    /**
     * BUG-22 FIX: only ONE updateAvailability method (Boolean parameter).
     * The duplicate primitive-boolean overload with inconsistent error types removed.
     */
    @Transactional
    public ListingResponse updateAvailability(UUID id, Boolean isAvailable, String ownerEmail) {
        if (isAvailable == null) {
            throw BusinessException.badRequest("isAvailable must be true or false", "INVALID_INPUT");
        }
        Listing listing = listingRepository.findByIdWithLock(id)
            .orElseThrow(() -> BusinessException.notFound("Listing", id));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw BusinessException.forbidden("You do not own listing " + id);
        }

        listing.setIsAvailable(isAvailable);
        listing.setUpdatedAt(LocalDateTime.now());
        return DtoMapper.mapToListingResponse(listingRepository.save(listing));
    }

    /**
     * Delete a listing
     */
    /**
     * BUG-21 FIX: refuse deletion if any active bookings exist for the listing.
     * Active = PENDING_PAYMENT, CONFIRMED, or IN_USE.
     */
    @Transactional
    public void deleteListing(UUID id, String userEmail) {
        Listing listing = listingRepository.findByIdWithLock(id)
            .orElseThrow(() -> BusinessException.notFound("Listing", id));

        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));

        if (!listing.getOwner().getId().equals(user.getId())) {
            throw BusinessException.forbidden("You are not authorized to delete this listing");
        }

        // BUG-21 FIX: block deletion if active bookings exist (OPTIMIZED)
        if (bookingRepository.existsByListingIdAndBookingStatusIn(id, ACTIVE_BOOKING_STATUSES)) {
            throw BusinessException.conflict(
                "Cannot delete listing with active booking(s). Cancel all bookings first.",
                "ACTIVE_BOOKINGS_EXIST"
            );
        }

        listingRepository.delete(listing);
        log.info("Listing {} deleted by {}", id, userEmail);
    }

    /**
     * Get listings by owner
     */
    public PagedResponse<ListingResponse> getListingsByOwner(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));

        if (user.getUserType() != User.UserType.OWNER
            && user.getUserType() != User.UserType.ADMIN) {
            throw BusinessException.forbidden("User is not an owner");
        }

        Page<Listing> listings = listingRepository.findByOwnerId(user.getId(), pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    /**
     * Get published listings by owner
     */
    public PagedResponse<ListingResponse> getPublishedListingsByOwner(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        
        Page<Listing> listings = listingRepository.findByOwnerIdAndIsPublished(user.getId(), true, pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    public PagedResponse<ListingResponse> getDraftListingsByOwner(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        
        Page<Listing> listings = listingRepository.findByOwnerIdAndIsPublished(user.getId(), false, pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    // BUG-22 FIX: duplicate primitive-boolean overload removed.
    // Use updateAvailability(UUID, Boolean, String) above.


    /**
     * Get listings by category
     */
    public PagedResponse<ListingResponse> getListingsByCategory(String category, Pageable pageable) {
        Page<Listing> listings = listingRepository.findByCategoryIgnoreCaseAndIsPublishedTrue(category, pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    /**
     * Get listings by city
     */
    public PagedResponse<ListingResponse> getListingsByCity(String city, Pageable pageable) {
        Page<Listing> listings = listingRepository.findByCityIgnoreCaseAndIsPublishedTrue(city, pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    /**
     * Get listings by type (bike, car, etc.)
     */
    public PagedResponse<ListingResponse> getListingsByType(String type, Pageable pageable) {
        Page<Listing> listings = listingRepository.findByTypeIgnoreCaseAndIsPublishedTrue(type, pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    /**
     * Get featured listings (highest rated)
     */
    public PagedResponse<ListingResponse> getFeaturedListings(Pageable pageable) {
        Page<Listing> listings = listingRepository.findByIsPublishedTrueOrderByTotalRatingsDesc(pageable);
        return PagedResponse.fromPage(listings.map(DtoMapper::mapToListingResponse));
    }

    @Transactional
    public void blockDates(UUID listingId, java.time.LocalDate startDate, java.time.LocalDate endDate, String ownerEmail) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> BusinessException.notFound("Listing", listingId));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw BusinessException.forbidden("You do not own this listing");
        }

        // Validate against active bookings
        if (bookingRepository.existsConflictingBooking(listingId, startDate, endDate, List.copyOf(ACTIVE_BOOKING_STATUSES))) {
            throw BusinessException.conflict("Dates overlap with an active booking", "DATE_CONFLICT");
        }

        BlockedDate blockedDate = new BlockedDate();
        blockedDate.setListing(listing);
        blockedDate.setStartDate(startDate);
        blockedDate.setEndDate(endDate);
        blockedDate.setReason("MANUAL");

        blockedDateRepository.save(blockedDate);
    }

    @Transactional
    public void unblockDates(UUID listingId, UUID blockId, String ownerEmail) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> BusinessException.notFound("Listing", listingId));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw BusinessException.forbidden("You do not own this listing");
        }

        BlockedDate blockedDate = blockedDateRepository.findById(blockId)
            .orElseThrow(() -> BusinessException.notFound("Blocked date", blockId));

        if (!blockedDate.getListing().getId().equals(listingId)) {
            throw BusinessException.badRequest("Blocked date does not belong to this listing", "INVALID_BLOCK_ID");
        }

        blockedDateRepository.delete(blockedDate);
    }

    public AvailabilityResponse getAvailability(UUID listingId) {
        // Get manual blocks from blocked_dates table
        List<BlockedDate> manualBlocks = blockedDateRepository.findByListing_Id(listingId);
        
        // Get active bookings (PENDING_PAYMENT, CONFIRMED, IN_USE) (OPTIMIZED)
        List<com.rentit.model.Booking> activeBookings = bookingRepository.findByListingIdAndBookingStatusIn(listingId, ACTIVE_BOOKING_STATUSES);
        
        List<AvailabilityResponse.BlockedRange> ranges = new java.util.ArrayList<>();
        
        // Add manual blocks
        ranges.addAll(manualBlocks.stream()
            .map(b -> AvailabilityResponse.BlockedRange.builder()
                .id(b.getId())
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .reason(b.getReason())
                .build())
            .collect(java.util.stream.Collectors.toList()));
        
        // Add booking blocks
        ranges.addAll(activeBookings.stream()
            .map(b -> AvailabilityResponse.BlockedRange.builder()
                .id(null) // Bookings don't have a BlockedDate ID
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .reason("BOOKING")
                .build())
            .collect(java.util.stream.Collectors.toList()));
        
        return AvailabilityResponse.builder()
            .blockedRanges(ranges)
            .build();
    }

}
