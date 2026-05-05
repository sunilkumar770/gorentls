package com.rentit.controller;

import com.rentit.dto.FavoriteDto;
import com.rentit.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for a renter's saved (favourited) listings.
 *
 * <p>All endpoints require an authenticated renter session.</p>
 *
 * <pre>
 * GET    /api/favorites/my-favorites        — list all saved listings
 * POST   /api/favorites/{listingId}         — save a listing (idempotent)
 * DELETE /api/favorites/{listingId}         — remove a saved listing
 * </pre>
 */
@Tag(name = "Favorites", description = "Renter saved-listings (favourites) management")
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    // ── GET my-favorites ──────────────────────────────────────────────────────

    @Operation(summary = "List all favourites for the authenticated renter")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Favourite list returned"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/my-favorites")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FavoriteDto>> getMyFavorites(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteService.getMyFavorites(userDetails.getUsername()));
    }

    // ── POST /{listingId} ─────────────────────────────────────────────────────

    @Operation(summary = "Save (favourite) a listing — idempotent")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Listing saved or already saved"),
        @ApiResponse(responseCode = "404", description = "Listing not found"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/{listingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FavoriteDto> addFavorite(
            @Parameter(description = "UUID of the listing to save", required = true)
            @PathVariable UUID listingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteService.addFavorite(listingId, userDetails.getUsername()));
    }

    // ── DELETE /{listingId} ───────────────────────────────────────────────────

    @Operation(summary = "Remove a listing from favourites — no-op if not saved")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Removed (or was never saved)"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @DeleteMapping("/{listingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeFavorite(
            @Parameter(description = "UUID of the listing to un-save", required = true)
            @PathVariable UUID listingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        favoriteService.removeFavorite(listingId, userDetails.getUsername());
        return ResponseEntity.noContent().build(); // 204 is more correct than 200 for DELETE
    }
}
