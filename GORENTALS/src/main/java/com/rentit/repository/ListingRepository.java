package com.rentit.repository;

import com.rentit.model.Listing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID> {
    
    boolean existsByTitle(String title);
    // ── N+1 ELIMINATION: Single listing detail — eager-fetches owner ───────────
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Optional<Listing> findById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    @Query("SELECT l FROM Listing l WHERE l.id = :id")
    Optional<Listing> findByIdWithLock(@Param("id") UUID id);

    @Override
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findAll(Pageable pageable);

    /**
     * Find listings by owner ID (paginated)
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByOwnerId(UUID ownerId, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    List<Listing> findByOwnerId(UUID ownerId);
    
    /**
     * Find published listings
     */
    Page<Listing> findByIsPublishedTrue(Pageable pageable);
    
    /**
     * Find available published listings
     */
    Page<Listing> findByIsPublishedTrueAndIsAvailableTrue(Pageable pageable);
    
    /**
     * Count published and available listings
     */
    @Query("SELECT COUNT(l) FROM Listing l WHERE l.isPublished = true AND l.isAvailable = true")
    long countByIsPublishedTrueAndIsAvailableTrue();
    
    /**
     * Count unpublished listings
     */
    @Query("SELECT COUNT(l) FROM Listing l WHERE l.isPublished = false")
    long countByIsPublishedFalse();
    
    /**
     * Search listings with filters
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    @Query("SELECT l FROM Listing l WHERE " +
           "(:city IS NULL OR LOWER(l.city) LIKE LOWER(CAST(:city AS string))) " +
           "AND (:category IS NULL OR LOWER(l.category) = LOWER(CAST(:category AS string))) " +
           "AND (:type IS NULL OR LOWER(l.type) = LOWER(CAST(:type AS string))) " +
           "AND (:minPrice IS NULL OR l.pricePerDay >= :minPrice) " +
           "AND (:maxPrice IS NULL OR l.pricePerDay <= :maxPrice) " +
           "AND l.isPublished = true AND l.isAvailable = true ")
    Page<Listing> searchListings(@Param("city") String city,
                                 @Param("category") String category,
                                 @Param("type") String type,
                                 @Param("minPrice") BigDecimal minPrice,
                                 @Param("maxPrice") BigDecimal maxPrice,
                                 Pageable pageable);
    
    /**
     * Search listings by title or description
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    @Query("SELECT l FROM Listing l WHERE l.isPublished = true AND l.isAvailable = true " +
           "AND (LOWER(l.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "OR LOWER(l.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))")
    Page<Listing> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    /**
     * Find listings by city
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByCityIgnoreCaseAndIsPublishedTrue(String city, Pageable pageable);
    
    /**
     * Find listings by category
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByCategoryIgnoreCaseAndIsPublishedTrue(String category, Pageable pageable);
    
    /**
     * Find listings by type (bike, car, etc.)
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByTypeIgnoreCaseAndIsPublishedTrue(String type, Pageable pageable);
    
    /**
     * Get top categories by listing count
     */
    @Query("SELECT l.category, COUNT(l), SUM(l.pricePerDay) FROM Listing l " +
           "WHERE l.isPublished = true GROUP BY l.category ORDER BY COUNT(l) DESC")
    List<Object[]> getTopCategories();
    
    /**
     * Get top cities by listing count and bookings
     */
    @Query("SELECT l.city, COUNT(DISTINCT l), COUNT(b), COALESCE(SUM(b.totalAmount), 0) " +
           "FROM Listing l LEFT JOIN Booking b ON b.listing = l AND b.bookingStatus = 'COMPLETED' " +
           "WHERE l.isPublished = true AND l.city IS NOT NULL " +
           "GROUP BY l.city ORDER BY COUNT(b) DESC")
    List<Object[]> getTopCities();
    
    
 // Add this method to ListingRepository.java
    Page<Listing> findByIsPublishedFalse(Pageable pageable);
    
    /**
     * Get listings by price range
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByPricePerDayBetweenAndIsPublishedTrue(BigDecimal minPrice, 
                                                             BigDecimal maxPrice, 
                                                             Pageable pageable);
    
    /**
     * Get listings with highest ratings
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByIsPublishedTrueOrderByTotalRatingsDesc(Pageable pageable);
    
    /**
     * Get owner's listings with stats
     */
    @Query("SELECT l, COUNT(b), COALESCE(SUM(b.totalAmount), 0) " +
           "FROM Listing l LEFT JOIN Booking b ON b.listing = l AND b.bookingStatus = 'COMPLETED' " +
           "WHERE l.owner.id = :ownerId GROUP BY l")
    List<Object[]> findListingsWithStatsByOwner(@Param("ownerId") UUID ownerId);
    
    /**
     * Count listings by category
     */
    @Query("SELECT l.category, COUNT(l) FROM Listing l WHERE l.isPublished = true GROUP BY l.category")
    List<Object[]> countListingsByCategory();
    
    /**
     * Count listings by city
     */
    @Query("SELECT l.city, COUNT(l) FROM Listing l WHERE l.isPublished = true AND l.city IS NOT NULL GROUP BY l.city")
    List<Object[]> countListingsByCity();
    
    /**
     * Get available listings count
     */
    @Query("SELECT COUNT(l) FROM Listing l WHERE l.isPublished = true AND l.isAvailable = true")
    long getAvailableListingsCount();
    
    /**
     * Get total listings value
     */
    @Query("SELECT SUM(l.pricePerDay) FROM Listing l WHERE l.isPublished = true")
    BigDecimal getTotalListingsValue();
    
    /**
     * Find listings by owner and published status
     */
    Page<Listing> findByOwnerIdAndIsPublished(UUID ownerId, Boolean isPublished, Pageable pageable);

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.owner.id = :ownerId")
    long countByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.owner.id = :ownerId AND l.isPublished = true AND l.isAvailable = true")
    long countActiveByOwnerId(@Param("ownerId") UUID ownerId);
}
