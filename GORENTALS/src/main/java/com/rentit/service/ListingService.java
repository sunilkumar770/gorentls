package com.rentit.service;

import com.rentit.dto.AvailabilityResponse;
import com.rentit.dto.ListingRequest;
import com.rentit.dto.ListingResponse;
import com.rentit.dto.PagedResponse;
import com.rentit.dto.UserResponse;
import com.rentit.model.BlockedDate;
import com.rentit.model.BookingStatus;
import com.rentit.model.Listing;
import com.rentit.model.User;
import com.rentit.model.UserProfile;
import com.rentit.repository.BlockedDateRepository;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
 *             (PENDING, ACCEPTED, CONFIRMED, IN_PROGRESS).
 * BUG-22 FIX: removed the duplicate updateAvailability(UUID, boolean, String)
 *             overload that had inconsistent error types. One method remains.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ListingService {

    /** Booking statuses that represent an active, in-flight rental. */
    private static final Set<BookingStatus> ACTIVE_BOOKING_STATUSES = EnumSet.of(
        BookingStatus.PENDING,
        BookingStatus.ACCEPTED,
        BookingStatus.CONFIRMED,
        BookingStatus.IN_PROGRESS
    );

    private final ListingRepository     listingRepository;
    private final UserRepository         userRepository;
    private final BlockedDateRepository  blockedDateRepository;
    private final BookingRepository      bookingRepository;
    private final NotificationService    notificationService;

    public PagedResponse<ListingResponse> getAllListings(int page, int size, 
        String city, String category) {
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
      if ((city == null || city.isEmpty()) && (category == null || category.isEmpty())) {
        Page<Listing> listings = listingRepository
          .findByIsPublishedTrueAndIsAvailableTrue(pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
      }
      return searchListings(city, category, null, null, null, pageable);
    }

    /**
     * Search listings with filters
     */
    public PagedResponse<ListingResponse> searchListings(String city, String category, String type, 
                                                BigDecimal minPrice, BigDecimal maxPrice, 
                                                Pageable pageable) {
        // Optimization: If no filters are provided, use a simpler query to avoid potential null-param evaluation issues
        if ((city == null || city.isEmpty()) && 
            (category == null || category.isEmpty()) && 
            (type == null || type.isEmpty()) && 
            minPrice == null && 
            maxPrice == null) {
            Page<Listing> listings = listingRepository.findByIsPublishedTrueAndIsAvailableTrue(pageable);
            return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
        }

        String cityPattern = (city != null && !city.isEmpty()) ? "%" + city + "%" : null;
        Page<Listing> listings = listingRepository.searchListings(
            cityPattern, category, type, minPrice, maxPrice, pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    /**
     * Get listing by ID
     */
    public ListingResponse getListingById(UUID id) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        return mapToListingResponse(listing);
    }

    /**
     * Create a new listing
     */
    @Transactional
    public ListingResponse createListing(ListingRequest request, String userEmail) {
        User owner = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (owner.getUserType() != User.UserType.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Only owners can create listings");
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

        // Soft block: Force isPublished=false if KYC is not APPROVED
        boolean isKycApproved = owner.getProfile() != null &&
                                owner.getProfile().getKycStatus() == UserProfile.KYCStatus.APPROVED;

        if (!isKycApproved) {
            listing.setIsPublished(false);
        } else {
            listing.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : Boolean.TRUE);
        }

        listing.setTotalRatings(BigDecimal.ZERO);
        listing.setRatingCount(0);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());
        
        Listing savedListing = listingRepository.save(listing);
        
        return mapToListingResponse(savedListing);
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
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to update this listing");
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

        // BUG-20 FIX: re-apply KYC gate when caller tries to publish
        if (request.getIsPublished() != null) {
            if (Boolean.TRUE.equals(request.getIsPublished())) {
                boolean kycApproved = user.getProfile() != null
                    && user.getProfile().getKycStatus() == UserProfile.KYCStatus.APPROVED;
                if (!kycApproved) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "KYC verification must be approved before publishing a listing");
                }
            }
            listing.setIsPublished(request.getIsPublished());
        }

        listing.setUpdatedAt(LocalDateTime.now());
        return mapToListingResponse(listingRepository.save(listing));
    }

    @Transactional
    public ListingResponse publishListing(UUID id, String userEmail) {
        // Get the listing
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        // Get the user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify ownership
        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to publish this listing");
        }
        
        // Check if listing is complete
        if (listing.getTitle() == null || listing.getTitle().isEmpty()) {
            throw new RuntimeException("Please add a title before publishing");
        }
        if (listing.getPricePerDay() == null || listing.getPricePerDay().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Please add a valid price before publishing");
        }
        
        // Publish the listing
        listing.setIsPublished(true);
        listing.setUpdatedAt(LocalDateTime.now());
        
        Listing publishedListing = listingRepository.save(listing);
        
        return mapToListingResponse(publishedListing);
    }

    /**
     * BUG-22 FIX: only ONE updateAvailability method (Boolean parameter).
     * The duplicate primitive-boolean overload with inconsistent error types removed.
     */
    @Transactional
    public ListingResponse updateAvailability(UUID id, Boolean isAvailable, String ownerEmail) {
        if (isAvailable == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "isAvailable must be true or false");
        }
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Listing not found: " + id));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw new AccessDeniedException("You do not own listing " + id);
        }

        listing.setIsAvailable(isAvailable);
        listing.setUpdatedAt(LocalDateTime.now());
        return mapToListingResponse(listingRepository.save(listing));
    }

    /**
     * Delete a listing
     */
    /**
     * BUG-21 FIX: refuse deletion if any active bookings exist for the listing.
     * Active = PENDING, ACCEPTED, CONFIRMED, or IN_PROGRESS.
     */
    @Transactional
    public void deleteListing(UUID id, String userEmail) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to delete this listing");
        }

        // BUG-21 FIX: block deletion if active bookings exist
        long activeCount = bookingRepository.findByListingId(id, Pageable.unpaged())
            .stream()
            .filter(b -> ACTIVE_BOOKING_STATUSES.contains(b.getStatus()))
            .count();
        if (activeCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cannot delete listing with " + activeCount + " active booking(s). "
                + "Cancel all bookings first.");
        }

        listingRepository.delete(listing);
        log.info("Listing {} deleted by {}", id, userEmail);
    }

    /**
     * Get listings by owner
     */
    public PagedResponse<ListingResponse> getListingsByOwner(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getUserType() != User.UserType.OWNER
            && user.getUserType() != User.UserType.ADMIN) {
            throw new AccessDeniedException("User is not an owner");
        }

        Page<Listing> listings = listingRepository.findByOwnerId(user.getId(), pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    /**
     * Get published listings by owner
     */
    public PagedResponse<ListingResponse> getPublishedListingsByOwner(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Page<Listing> listings = listingRepository.findByOwnerIdAndIsPublished(user.getId(), true, pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    /**
     * Get draft listings by owner
     */
    public PagedResponse<ListingResponse> getDraftListingsByOwner(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Page<Listing> listings = listingRepository.findByOwnerIdAndIsPublished(user.getId(), false, pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    // BUG-22 FIX: duplicate primitive-boolean overload removed.
    // Use updateAvailability(UUID, Boolean, String) above.


    /**
     * Get listings by category
     */
    public PagedResponse<ListingResponse> getListingsByCategory(String category, Pageable pageable) {
        Page<Listing> listings = listingRepository.findByCategoryIgnoreCaseAndIsPublishedTrue(category, pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    /**
     * Get listings by city
     */
    public PagedResponse<ListingResponse> getListingsByCity(String city, Pageable pageable) {
        Page<Listing> listings = listingRepository.findByCityIgnoreCaseAndIsPublishedTrue(city, pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    /**
     * Get listings by type (bike, car, etc.)
     */
    public PagedResponse<ListingResponse> getListingsByType(String type, Pageable pageable) {
        Page<Listing> listings = listingRepository.findByTypeIgnoreCaseAndIsPublishedTrue(type, pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    /**
     * Get featured listings (highest rated)
     */
    public PagedResponse<ListingResponse> getFeaturedListings(Pageable pageable) {
        Page<Listing> listings = listingRepository.findByIsPublishedTrueOrderByTotalRatingsDesc(pageable);
        return PagedResponse.fromPage(listings.map(this::mapToListingResponse));
    }

    @Transactional
    public void blockDates(UUID listingId, java.time.LocalDate startDate, java.time.LocalDate endDate, String ownerEmail) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw new AccessDeniedException("You do not own this listing");
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
            .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw new AccessDeniedException("You do not own this listing");
        }

        BlockedDate blockedDate = blockedDateRepository.findById(blockId)
            .orElseThrow(() -> new RuntimeException("Blocked date not found"));

        if (!blockedDate.getListing().getId().equals(listingId)) {
            throw new IllegalArgumentException("Blocked date does not belong to this listing");
        }

        blockedDateRepository.delete(blockedDate);
    }

    public AvailabilityResponse getAvailability(UUID listingId) {
        List<BlockedDate> blockedDates = blockedDateRepository.findByListing_Id(listingId);

        List<AvailabilityResponse.BlockedRange> ranges = blockedDates.stream()
            .map(b -> AvailabilityResponse.BlockedRange.builder()
                .id(b.getId())
                .startDate(b.getStartDate())
                .endDate(b.getEndDate())
                .reason(b.getReason())
                .build())
            .collect(java.util.stream.Collectors.toList());

        return AvailabilityResponse.builder()
            .blockedRanges(ranges)
            .build();
    }

    /**
     * Map Listing entity to ListingResponse DTO
     */
    private ListingResponse mapToListingResponse(Listing listing) {
        User owner = listing.getOwner();
        
        return ListingResponse.builder()
                .id(listing.getId())
                .owner(UserResponse.builder()
                        .id(owner.getId())
                        .fullName(owner.getFullName())
                        .email(owner.getEmail())
                        .phone(owner.getPhone())
                        .build())
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
}