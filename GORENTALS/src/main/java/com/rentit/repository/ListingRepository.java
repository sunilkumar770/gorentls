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

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Optional<Listing> findById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    @Query("SELECT l FROM Listing l WHERE l.id = :id")
    Optional<Listing> findByIdWithLock(@Param("id") UUID id);

    @Override
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByOwnerId(UUID ownerId, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    List<Listing> findByOwnerId(UUID ownerId);

    Page<Listing> findByIsPublishedTrue(Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByIsPublishedTrueAndIsAvailableTrue(Pageable pageable);

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.isPublished = true AND l.isAvailable = true")
    long countByIsPublishedTrueAndIsAvailableTrue();

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.isPublished = false")
    long countByIsPublishedFalse();

    /**
     * FIXED: Replaced Hibernate-specific cast(:param as string) IS NULL
     * with standard JPQL :param IS NULL to eliminate HTTP 500 on PostgreSQL
     * when any non-null filter value (category, city, type) is supplied.
     *
     * city  → LIKE match using %-wrapped escaped pattern from SearchUtils.likeContents()
     * category/type → exact case-insensitive equality via LOWER()
     * minPrice/maxPrice → BigDecimal comparison, null-safe via :param IS NULL
     */
    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    @Query("SELECT l FROM Listing l WHERE " +
           "(:city IS NULL OR LOWER(l.city) LIKE LOWER(cast(:city as string))) " +
           "AND (:category IS NULL OR LOWER(l.category) = LOWER(cast(:category as string))) " +
           "AND (:type IS NULL OR LOWER(l.type) = LOWER(cast(:type as string))) " +
           "AND (:ownerId IS NULL OR l.owner.id = :ownerId) " +
           "AND (:minPrice IS NULL OR l.pricePerDay >= :minPrice) " +
           "AND (:maxPrice IS NULL OR l.pricePerDay <= :maxPrice) " +
           "AND l.isPublished = true AND l.isAvailable = true " +
           "ORDER BY l.createdAt DESC")
    Page<Listing> searchListings(
            @Param("city")     String city,
            @Param("category") String category,
            @Param("type")     String type,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("ownerId")  UUID ownerId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    @Query("SELECT l FROM Listing l WHERE l.isPublished = true AND l.isAvailable = true " +
           "AND (LOWER(l.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(l.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Listing> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByCityIgnoreCaseAndIsPublishedTrue(String city, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByCategoryIgnoreCaseAndIsPublishedTrue(String category, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByTypeIgnoreCaseAndIsPublishedTrue(String type, Pageable pageable);

    @Query("SELECT l.category, COUNT(l), SUM(l.pricePerDay) FROM Listing l " +
           "WHERE l.isPublished = true GROUP BY l.category ORDER BY COUNT(l) DESC")
    List<Object[]> getTopCategories();

    @Query("SELECT l.city, COUNT(DISTINCT l), COUNT(b), COALESCE(SUM(b.totalAmount), 0) " +
           "FROM Listing l LEFT JOIN Booking b ON b.listing = l AND b.bookingStatus = 'COMPLETED' " +
           "WHERE l.isPublished = true AND l.city IS NOT NULL " +
           "GROUP BY l.city ORDER BY COUNT(b) DESC")
    List<Object[]> getTopCities();

    Page<Listing> findByIsPublishedFalse(Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByPricePerDayBetweenAndIsPublishedTrue(
            BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);

    @EntityGraph(attributePaths = {"owner", "owner.profile"})
    Page<Listing> findByIsPublishedTrueOrderByTotalRatingsDesc(Pageable pageable);

    @Query("SELECT l, COUNT(b), COALESCE(SUM(b.totalAmount), 0) " +
           "FROM Listing l LEFT JOIN Booking b ON b.listing = l AND b.bookingStatus = 'COMPLETED' " +
           "WHERE l.owner.id = :ownerId GROUP BY l")
    List<Object[]> findListingsWithStatsByOwner(@Param("ownerId") UUID ownerId);

    @Query("SELECT l.category, COUNT(l) FROM Listing l WHERE l.isPublished = true GROUP BY l.category")
    List<Object[]> countListingsByCategory();

    @Query("SELECT l.city, COUNT(l) FROM Listing l " +
           "WHERE l.isPublished = true AND l.city IS NOT NULL GROUP BY l.city")
    List<Object[]> countListingsByCity();

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.isPublished = true AND l.isAvailable = true")
    long getAvailableListingsCount();

    @Query("SELECT SUM(l.pricePerDay) FROM Listing l WHERE l.isPublished = true")
    BigDecimal getTotalListingsValue();

    Page<Listing> findByOwnerIdAndIsPublished(UUID ownerId, Boolean isPublished, Pageable pageable);

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.owner.id = :ownerId")
    long countByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("SELECT COUNT(l) FROM Listing l " +
           "WHERE l.owner.id = :ownerId AND l.isPublished = true AND l.isAvailable = true")
    long countActiveByOwnerId(@Param("ownerId") UUID ownerId);
}
