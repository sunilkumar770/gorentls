package com.rentit.controller;

import com.rentit.dto.*;
import com.rentit.model.AdminAuditLog;
import com.rentit.repository.AdminAuditLogRepository;
import com.rentit.service.AdminService;
import com.rentit.service.PlatformAnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.rentit.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private PlatformAnalyticsService platformAnalyticsService;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    @Autowired
    private NotificationService notificationService;

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    /**
     * @param search Optional free-text search across email / fullName / phone.
     *               Leave blank (or omit) to return all users.
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getUsers(pageable, search));
    }

    @PatchMapping("/users/{userId}/verify")
    public ResponseEntity<UserResponse> verifyUser(@PathVariable UUID userId,
                                                   Authentication auth,
                                                   HttpServletRequest req) {
        UserResponse resp = adminService.verifyUser(userId);
        audit(auth, "VERIFY_USER", "USER", userId,
              "Verified KYC for user " + userId, req);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/users/{userId}/reject-kyc")
    public ResponseEntity<UserResponse> rejectKYC(@PathVariable UUID userId,
                                                   @Valid @RequestBody KYCRejectionRequest request,
                                                   Authentication auth,
                                                   HttpServletRequest req) {
        UserResponse resp = adminService.rejectUserKYC(userId, request.getReason());
        audit(auth, "REJECT_KYC", "USER", userId,
              "Rejected KYC for user " + userId + ". Reason: " + request.getReason(), req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/users/pending-kyc")
    public ResponseEntity<Page<UserResponse>> getPendingKYC(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        return ResponseEntity.ok(adminService.getPendingKYCUsers(pageable));
    }

    @PatchMapping("/users/{userId}/suspend")
    public ResponseEntity<UserResponse> suspendUser(@PathVariable UUID userId,
                                                    Authentication auth,
                                                    HttpServletRequest req) {
        UserResponse resp = adminService.suspendUser(userId);
        audit(auth, "SUSPEND_USER", "USER", userId,
              "Suspended user " + userId, req);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/users/{userId}/unsuspend")
    public ResponseEntity<UserResponse> unsuspendUser(@PathVariable UUID userId,
                                                      Authentication auth,
                                                      HttpServletRequest req) {
        UserResponse resp = adminService.unsuspendUser(userId);
        audit(auth, "UNSUSPEND_USER", "USER", userId,
              "Restored (unsuspended) user " + userId, req);
        return ResponseEntity.ok(resp);
    }

    // ── Owners ─────────────────────────────────────────────────────────────────

    /**
     * @param search Optional free-text search across email / fullName / phone.
     */
    @GetMapping("/owners")
    public ResponseEntity<Page<UserResponse>> getAllOwners(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getOwners(pageable, search));
    }

    @PatchMapping("/owners/{ownerId}/verify")
    public ResponseEntity<BusinessOwnerResponse> verifyOwner(@PathVariable UUID ownerId,
                                                              Authentication auth,
                                                              HttpServletRequest req) {
        BusinessOwnerResponse resp = adminService.verifyBusinessOwner(ownerId);
        audit(auth, "VERIFY_OWNER", "OWNER", ownerId,
              "Verified business owner " + ownerId, req);
        return ResponseEntity.ok(resp);
    }

    // ── Listings ───────────────────────────────────────────────────────────────

    @GetMapping("/listings/pending")
    public ResponseEntity<Page<ListingResponse>> getPendingListings(Pageable pageable) {
        return ResponseEntity.ok(adminService.getPendingListings(pageable));
    }

    @GetMapping("/listings")
    public ResponseEntity<Page<ListingResponse>> getAllListings(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllListings(pageable));
    }

    @PatchMapping("/listings/{listingId}/approve")
    public ResponseEntity<ListingResponse> approveListing(@PathVariable UUID listingId,
                                                          Authentication auth,
                                                          HttpServletRequest req) {
        ListingResponse resp = adminService.approveListing(listingId);
        audit(auth, "APPROVE_LISTING", "LISTING", listingId,
              "Approved listing " + listingId, req);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/listings/{listingId}/reject")
    public ResponseEntity<Void> rejectListing(@PathVariable UUID listingId,
                                              Authentication auth,
                                              HttpServletRequest req) {
        adminService.rejectListing(listingId);
        audit(auth, "REJECT_LISTING", "LISTING", listingId,
              "Rejected listing " + listingId, req);
        return ResponseEntity.noContent().build();
    }

    // ── Bookings / Transactions ────────────────────────────────────────────────

    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingResponse>> getAllBookings(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllBookings(pageable));
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionResponse>> getAllTransactions(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllTransactions(pageable));
    }

    // ── Analytics & Audit ─────────────────────────────────────────────────────

    @GetMapping("/analytics")
    public ResponseEntity<PlatformAnalytics> getPlatformAnalytics(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(platformAnalyticsService.getPlatformAnalytics(startDate, endDate));
    }

    @GetMapping("/audit-log")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(auditLogRepository.findAll(pageable));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SuccessResponse> broadcast(
            @Valid @RequestBody BroadcastNotificationRequest request) {
        notificationService.broadcastNotification(
                request.getTitle(),
                request.getMessage(),
                request.getType()
        );
        return ResponseEntity.ok(new SuccessResponse("Broadcast sent to all users", true));
    }

    @Async
    public void audit(Authentication auth, String action,
                         String entityType, UUID entityId,
                         String description, HttpServletRequest req) {
        try {
            String email = auth != null ? auth.getName() : "unknown";
            String ip = req != null ? req.getRemoteAddr() : null;
            AdminAuditLog entry = AdminAuditLog.of(null, email, action, entityType, entityId, description);
            entry.setIpAddress(ip);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Audit failure for action {}: {}", action, e.getMessage());
        }
    }
}
