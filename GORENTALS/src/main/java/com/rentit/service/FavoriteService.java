package com.rentit.service;

import com.rentit.dto.FavoriteDto;
import com.rentit.dto.ListingResponse;
import com.rentit.exception.BusinessException;
import com.rentit.model.Favorite;
import com.rentit.model.Listing;
import com.rentit.model.User;
import com.rentit.repository.FavoriteRepository;
import com.rentit.repository.ListingRepository;
import com.rentit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for managing a renter's saved listings (favourites).
 *
 * <p>All mutating operations are idempotent:
 * <ul>
 *   <li>{@link #addFavorite} returns the existing record if already saved.</li>
 *   <li>{@link #removeFavorite} is a no-op if the favourite does not exist.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository     userRepository;
    private final ListingRepository  listingRepository;

    // ── Queries ───────────────────────────────────────────────────────────────

    /**
     * Returns all listings saved by the authenticated renter, newest first.
     *
     * @param email the authenticated user's email (JWT subject)
     * @return list of {@link FavoriteDto}; empty if none saved
     */
    @Transactional(readOnly = true)
    public List<FavoriteDto> getMyFavorites(String email) {
        User user = resolveUser(email);

        List<FavoriteDto> result = favoriteRepository.findByRenterId(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        log.debug("getMyFavorites: user={} count={}", email, result.size());
        return result;
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    /**
     * Saves a listing to the renter's favourites.
     * If the listing is already saved, returns the existing record (idempotent).
     *
     * @param listingId UUID of the listing to save
     * @param email     authenticated renter's email
     * @return the saved {@link FavoriteDto}
     * @throws BusinessException if the user or listing cannot be found
     */
    @Transactional
    public FavoriteDto addFavorite(UUID listingId, String email) {
        User user = resolveUser(email);

        // Idempotency: return existing record without error
        if (favoriteRepository.existsByRenterIdAndListingId(user.getId(), listingId)) {
            log.debug("addFavorite: already exists user={} listing={}", email, listingId);
            return favoriteRepository.findByRenterIdAndListingId(user.getId(), listingId)
                    .map(this::mapToDto)
                    .orElseThrow(); // can't happen given existsBy returned true
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> BusinessException.notFound("Listing", listingId));

        Favorite favorite = Favorite.builder()
                .renter(user)
                .listing(listing)
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        log.info("addFavorite: user={} listing={} favoriteId={}", email, listingId, saved.getId());
        return mapToDto(saved);
    }

    /**
     * Removes a listing from the renter's favourites.
     * No-op if the listing was not saved.
     *
     * @param listingId UUID of the listing to un-save
     * @param email     authenticated renter's email
     */
    @Transactional
    public void removeFavorite(UUID listingId, String email) {
        User user = resolveUser(email);
        int deleted = favoriteRepository.deleteByRenterIdAndListingId(user.getId(), listingId);
        log.info("removeFavorite: user={} listing={} deleted={}", email, listingId, deleted);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("User", email));
    }

    private FavoriteDto mapToDto(Favorite favorite) {
        Listing l = favorite.getListing();

        ListingResponse listingResponse = null;
        if (l != null) {
            listingResponse = ListingResponse.builder()
                    .id(l.getId())
                    .title(l.getTitle())
                    .pricePerDay(l.getPricePerDay())
                    .images(l.getImages())
                    .city(l.getCity())
                    .location(l.getLocation())
                    .category(l.getCategory())
                    .build();
        }

        return FavoriteDto.builder()
                .id(favorite.getId())
                .listing(listingResponse)
                .createdAt(favorite.getCreatedAt())
                .build();
    }
}
