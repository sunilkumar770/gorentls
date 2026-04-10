package com.rentit.controller;

import com.rentit.dto.ListingRequest;
import com.rentit.dto.ListingResponse;
import com.rentit.dto.PagedResponse;
import com.rentit.service.ListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/listings")
public class ListingController {

    @Autowired
    private ListingService listingService;

    @GetMapping
    public ResponseEntity<PagedResponse<ListingResponse>> getAllListings(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String category) {
      return ResponseEntity.ok(
        listingService.getAllListings(page, size, city, category));
    }

    @GetMapping("/owner/mine")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PagedResponse<ListingResponse>> getMyListings(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        return ResponseEntity.ok(listingService.getListingsByOwner(userDetails.getUsername(), pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<PagedResponse<ListingResponse>> searchListings(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            Pageable pageable) {
        return ResponseEntity.ok(listingService.searchListings(city, category, type, minPrice, maxPrice, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getListing(@PathVariable UUID id) {
        return ResponseEntity.ok(listingService.getListingById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ListingResponse> createListing(
            @Valid @RequestBody ListingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Creating listing for user {}: {}", userDetails.getUsername(), request.getTitle());
        try {
            return ResponseEntity.ok(listingService.createListing(request, userDetails.getUsername()));
        } catch (Exception e) {
            log.error("Failed to create listing: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable UUID id,
            @Valid @RequestBody ListingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(listingService.updateListing(id, request, userDetails.getUsername()));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ListingResponse> publishListing(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(listingService.publishListing(id, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> deleteListing(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        listingService.deleteListing(id, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }


}