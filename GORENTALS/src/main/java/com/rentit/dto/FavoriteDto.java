package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response payload for a renter's saved listing (favourite).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteDto {
    /** Internal favourite record ID. */
    private Long id;

    /** Compact listing summary – never null for valid favourites. */
    private ListingResponse listing;

    /** UTC timestamp when the renter saved this listing. */
    private Instant createdAt;
}
