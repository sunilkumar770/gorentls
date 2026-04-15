package com.rentit.service;

import com.rentit.dto.AvailabilityResponse;
import com.rentit.dto.ListingRequest;
import com.rentit.dto.ListingResponse;
import com.rentit.dto.PagedResponse;
import com.rentit.dto.UserResponse;
import com.rentit.model.BlockedDate;
import com.rentit.model.Listing;
import com.rentit.model.User;
import com.rentit.model.UserProfile;
import com.rentit.repository.BlockedDateRepository;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.access.AccessDeniedException;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BlockedDateRepository blockedDateRepository;

    @Autowired
    private NotificationService notificationService;

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
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        return mapToListingResponse(listing);
    }

    /**
     * Create a new listing
     */
    @Transactional
    public ListingResponse createListing(ListingRequest request, String userEmail) {
        // Get the owner
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is an owner
        if (owner.getUserType() != User.UserType.OWNER) {
            throw new RuntimeException("Only business owners can create listings");
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
    @Transactional
    public ListingResponse updateListing(UUID id, ListingRequest request, String userEmail) {
        // Get the listing
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        // Get the user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify ownership
        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this listing");
        }
        
        // Update listing fields
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
            boolean isKycApproved = user.getProfile() != null &&
                                    user.getProfile().getKycStatus() == UserProfile.KYCStatus.APPROVED;
            if (request.getIsPublished() && !isKycApproved) {
                listing.setIsPublished(false);
            } else {
                listing.setIsPublished(request.getIsPublished());
            }
        }

        listing.setUpdatedAt(LocalDateTime.now());
        
        Listing updatedListing = listingRepository.save(listing);
        
        return mapToListingResponse(updatedListing);
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

        // KYC check
        boolean isKycApproved = user.getProfile() != null &&
                                user.getProfile().getKycStatus() == UserProfile.KYCStatus.APPROVED;
        if (!isKycApproved) {
            throw new RuntimeException("You must complete KYC verification before publishing a listing");
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

    @Transactional
    public ListingResponse updateAvailability(UUID id, Boolean isAvailable, String ownerEmail) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found: " + id));

        if (!listing.getOwner().getEmail().equals(ownerEmail)) {
            throw new AccessDeniedException("Forbidden: You do not own listing " + id);
        }

        listing.setIsAvailable(isAvailable);
        listing.setUpdatedAt(LocalDateTime.now());
        return mapToListingResponse(listingRepository.save(listing));
    }

    /**
     * Delete a listing
     */
    @Transactional
    public void deleteListing(UUID id, String userEmail) {
        // Get the listing
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        // Get the user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify ownership
        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this listing");
        }
        
        // Delete the listing
        listingRepository.delete(listing);
    }

    /**
     * Get listings by owner
     */
    public PagedResponse<ListingResponse> getListingsByOwner(String userEmail, Pageable pageable) {
        // Get the user
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is an owner
        if (user.getUserType() != User.UserType.OWNER) {
            throw new RuntimeException("User is not an owner");
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

    /**
     * Update listing availability
     */
    @Transactional
    public ListingResponse updateAvailability(UUID id, boolean isAvailable, String userEmail) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!listing.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this listing");
        }
        
        listing.setIsAvailable(isAvailable);
        listing.setUpdatedAt(LocalDateTime.now());
        
        Listing updatedListing = listingRepository.save(listing);
        
        return mapToListingResponse(updatedListing);
    }

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

        // Check for conflicts
        if (blockedDateRepository.isDateRangeBlocked(listingId, startDate, endDate)) {
            throw new IllegalStateException("These dates are already blocked");
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