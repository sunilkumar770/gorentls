package com.rentit.controller;

import com.rentit.dto.*;
import com.rentit.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    @GetMapping("/owners")
    public ResponseEntity<Page<BusinessOwnerResponse>> getAllOwners(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllOwners(pageable));
    }

    @PatchMapping("/users/{userId}/verify")
    public ResponseEntity<UserResponse> verifyUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.verifyUser(userId));
    }

    @PatchMapping("/owners/{ownerId}/verify")
    public ResponseEntity<BusinessOwnerResponse> verifyOwner(@PathVariable UUID ownerId) {
        return ResponseEntity.ok(adminService.verifyBusinessOwner(ownerId));
    }

    @GetMapping("/listings/pending")
    public ResponseEntity<Page<ListingResponse>> getPendingListings(Pageable pageable) {
        return ResponseEntity.ok(adminService.getPendingListings(pageable));
    }

    @PatchMapping("/listings/{listingId}/approve")
    public ResponseEntity<ListingResponse> approveListing(@PathVariable UUID listingId) {
        return ResponseEntity.ok(adminService.approveListing(listingId));
    }

    // Option 1: Using DELETE method with 204 No Content (Recommended)
    @DeleteMapping("/listings/{listingId}/reject")
    public ResponseEntity<Void> rejectListing(@PathVariable UUID listingId) {
        adminService.rejectListing(listingId);
        return ResponseEntity.noContent().build();
    }

    // Option 2: Using DELETE method with success message
    @DeleteMapping("/listings/{listingId}/reject-with-message")
    public ResponseEntity<?> rejectListingWithMessage(@PathVariable UUID listingId) {
        try {
            adminService.rejectListing(listingId);
            SuccessResponse successResponse = new SuccessResponse("Listing rejected successfully", true);
            return ResponseEntity.ok(successResponse);
        } catch (Exception e) {
            ErrorResponse errorResponse = new ErrorResponse("Failed to reject listing: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Option 3: Using PATCH method with JSON response (Alternative)
    @PatchMapping("/listings/{listingId}/reject-alternative")
    public ResponseEntity<Map<String, Object>> rejectListingAlternative(@PathVariable UUID listingId) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.rejectListing(listingId);
            response.put("success", true);
            response.put("message", "Listing rejected successfully");
            response.put("listingId", listingId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to reject listing: " + e.getMessage());
            response.put("listingId", listingId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionResponse>> getAllTransactions(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllTransactions(pageable));
    }

    @GetMapping("/listings")
    public ResponseEntity<Page<ListingResponse>> getAllListings(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllListings(pageable));
    }

    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingResponse>> getAllBookings(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllBookings(pageable));
    }

    @PatchMapping("/users/{userId}/suspend")
    public ResponseEntity<UserResponse> suspendUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.suspendUser(userId));
    }

    @PatchMapping("/users/{userId}/unsuspend")
    public ResponseEntity<UserResponse> unsuspendUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.unsuspendUser(userId));
    }

    @GetMapping("/analytics")
    public ResponseEntity<PlatformAnalytics> getPlatformAnalytics(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(adminService.getPlatformAnalytics(startDate, endDate));
    }
}