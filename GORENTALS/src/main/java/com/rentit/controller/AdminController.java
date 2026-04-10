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