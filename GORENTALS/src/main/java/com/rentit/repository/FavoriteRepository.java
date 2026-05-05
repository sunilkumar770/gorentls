package com.rentit.repository;

import com.rentit.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Persistence layer for renter favourites.
 *
 * <p>All look-ups are by the <em>renter's User.id</em> (UUID) and/or the
 * <em>Listing.id</em> (UUID).  Spring Data derives the SQL from the property
 * paths through the {@code renter} and {@code listing} associations.</p>
 */
@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /**
     * Returns all favourites for a given renter, newest first.
     */
    @Query("SELECT f FROM Favorite f JOIN FETCH f.listing WHERE f.renter.id = :renterId ORDER BY f.createdAt DESC")
    List<Favorite> findByRenterId(@Param("renterId") UUID renterId);

    /**
     * Checks whether a specific renter has already saved a specific listing.
     */
    Optional<Favorite> findByRenterIdAndListingId(UUID renterId, UUID listingId);

    /**
     * Checks existence without loading the entity (used for quick duplicate checks).
     */
    boolean existsByRenterIdAndListingId(UUID renterId, UUID listingId);

    /**
     * Hard-deletes a single favourite row identified by renter + listing.
     * Returns the number of rows deleted (0 or 1).
     */
    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.renter.id = :renterId AND f.listing.id = :listingId")
    int deleteByRenterIdAndListingId(@Param("renterId") UUID renterId,
                                    @Param("listingId") UUID listingId);
}
