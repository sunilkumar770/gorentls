package com.rentit.controller;

import com.rentit.dto.*;
import com.rentit.model.AdminAuditLog;
import com.rentit.service.AdminService;
import com.rentit.service.AuditService;
import com.rentit.service.PlatformAnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import com.rentit.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;
import java.util.List;
import com.rentit.model.Payout;
import com.rentit.model.LedgerTransaction;
import com.rentit.model.OwnerPayoutAccount;
import com.rentit.model.enums.PayoutStatus;
import com.rentit.model.enums.LedgerAccount;
import com.rentit.model.enums.PayoutOnboardingStatus;
import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private PlatformAnalyticsService platformAnalyticsService;

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
        auditService.audit("VERIFY_USER", "USER", userId, "Verified KYC for user " + userId);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/users/{userId}/reject-kyc")
    public ResponseEntity<UserResponse> rejectKYC(@PathVariable UUID userId,
                                                   @Valid @RequestBody KYCRejectionRequest request,
                                                   Authentication auth,
                                                   HttpServletRequest req) {
        UserResponse resp = adminService.rejectUserKYC(userId, request.getReason());
        auditService.audit("REJECT_KYC", "USER", userId, 
              "Rejected KYC for user " + userId + ". Reason: " + request.getReason());
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
        auditService.audit("SUSPEND_USER", "USER", userId, "Suspended user " + userId);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/users/{userId}/unsuspend")
    public ResponseEntity<UserResponse> unsuspendUser(@PathVariable UUID userId,
                                                      Authentication auth,
                                                      HttpServletRequest req) {
        UserResponse resp = adminService.unsuspendUser(userId);
        auditService.audit("UNSUSPEND_USER", "USER", userId, "Restored (unsuspended) user " + userId);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID userId,
                                           Authentication auth,
                                           HttpServletRequest req) {
        adminService.deleteUser(userId);
        auditService.audit("DELETE_USER", "USER", userId, "Deleted user " + userId);
        return ResponseEntity.noContent().build();
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
        auditService.audit("VERIFY_OWNER", "OWNER", ownerId, "Verified business owner " + ownerId);
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
        auditService.audit("APPROVE_LISTING", "LISTING", listingId, "Approved listing " + listingId);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/listings/{listingId}/reject")
    public ResponseEntity<Void> rejectListing(@PathVariable UUID listingId,
                                              Authentication auth,
                                              HttpServletRequest req) {
        adminService.rejectListing(listingId);
        auditService.audit("REJECT_LISTING", "LISTING", listingId, "Rejected listing " + listingId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/listings/{listingId}")
    public ResponseEntity<Void> deleteListing(@PathVariable UUID listingId,
                                              Authentication auth,
                                              HttpServletRequest req) {
        adminService.deleteListing(listingId);
        auditService.audit("DELETE_LISTING", "LISTING", listingId, "Completely deleted or anonymized listing " + listingId);
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
        return ResponseEntity.ok(adminService.getAuditLogs(pageable));
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

    // ── Admin Payout Controls ───────────────────────────────────────────────────

    @GetMapping("/payouts")
    public ResponseEntity<Page<Payout>> getPayouts(
            @RequestParam(required = false) PayoutStatus status,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getPayouts(status, ownerId, pageable));
    }

    @PatchMapping("/payouts/{payoutId}/hold")
    public ResponseEntity<Payout> holdPayout(@PathVariable UUID payoutId, Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' requested HOLD for payout ID: {}", adminName, payoutId);
        Payout payout = adminService.holdPayout(payoutId);
        auditService.audit("HOLD_PAYOUT", "PAYOUT", payoutId, "Admin " + adminName + " put payout " + payoutId + " on hold");
        return ResponseEntity.ok(payout);
    }

    @PatchMapping("/payouts/{payoutId}/release")
    public ResponseEntity<Payout> releasePayout(@PathVariable UUID payoutId, Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' requested RELEASE for payout ID: {}", adminName, payoutId);
        Payout payout = adminService.releasePayout(payoutId);
        auditService.audit("RELEASE_PAYOUT", "PAYOUT", payoutId, "Admin " + adminName + " released payout " + payoutId + " from hold");
        return ResponseEntity.ok(payout);
    }

    @PatchMapping("/payouts/{payoutId}/force-success")
    public ResponseEntity<Payout> forceSuccessPayout(@PathVariable UUID payoutId, Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' manually FORCED SUCCESS status for payout ID: {}", adminName, payoutId);
        Payout payout = adminService.forceSuccessPayout(payoutId);
        auditService.audit("FORCE_SUCCESS_PAYOUT", "PAYOUT", payoutId, "Admin " + adminName + " manually marked payout " + payoutId + " as SUCCESS");
        return ResponseEntity.ok(payout);
    }

    @PatchMapping("/payouts/{payoutId}/force-failed")
    public ResponseEntity<Payout> forceFailedPayout(
            @PathVariable UUID payoutId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        String rawReason = body != null ? body.get("reason") : "Manually failed by admin";
        // Defensive trimming to prevent DB column overflow
        String reason = rawReason != null ? rawReason.substring(0, Math.min(rawReason.length(), 255)) : "Manually failed by admin";
        
        log.warn("[ADMIN OPERATION] Admin '{}' manually FORCED FAILED status for payout ID: {} (Reason: {})", adminName, payoutId, reason);
        Payout payout = adminService.forceFailedPayout(payoutId, reason);
        auditService.audit("FORCE_FAILED_PAYOUT", "PAYOUT", payoutId, "Admin " + adminName + " manually marked payout " + payoutId + " as FAILED: " + reason);
        return ResponseEntity.ok(payout);
    }

    // ── Admin Ledger Controls ────────────────────────────────────────────────────

    @GetMapping("/ledger")
    public ResponseEntity<Page<LedgerTransaction>> getLedger(
            @RequestParam(required = false) LedgerAccount account,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getLedgerTransactions(account, pageable));
    }

    @GetMapping("/ledger/booking/{bookingId}")
    public ResponseEntity<List<LedgerTransaction>> getLedgerForBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminService.getLedgerTransactionsForBookingList(bookingId));
    }

    // ── Admin Owner Onboarding / Payout Accounts ─────────────────────────────────

    @GetMapping("/owner-payout-accounts")
    public ResponseEntity<Page<OwnerPayoutAccount>> getOwnerPayoutAccounts(
            @RequestParam(required = false) PayoutOnboardingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(adminService.getOwnerPayoutAccounts(status, pageable));
    }

    @PatchMapping("/owner-payout-accounts/{accountId}/verify")
    public ResponseEntity<OwnerPayoutAccount> verifyOwnerPayoutAccount(
            @PathVariable UUID accountId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' requested VERIFICATION for owner payout account ID: {}", adminName, accountId);
        
        String fundAccountId = body != null ? body.get("fundAccountId") : null;
        String verificationRef = body != null ? body.get("verificationRef") : null;
        OwnerPayoutAccount account = adminService.verifyOwnerPayoutAccount(accountId, fundAccountId, verificationRef);
        auditService.audit("VERIFY_PAYOUT_ACCOUNT", "OWNER_PAYOUT_ACCOUNT", accountId, "Admin " + adminName + " verified payout account " + accountId);
        return ResponseEntity.ok(account);
    }

    @PatchMapping("/owner-payout-accounts/{accountId}/suspend")
    public ResponseEntity<OwnerPayoutAccount> suspendOwnerPayoutAccount(@PathVariable UUID accountId, Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' requested SUSPENSION for owner payout account ID: {}", adminName, accountId);
        
        OwnerPayoutAccount account = adminService.suspendOwnerPayoutAccount(accountId);
        auditService.audit("SUSPEND_PAYOUT_ACCOUNT", "OWNER_PAYOUT_ACCOUNT", accountId, "Admin " + adminName + " suspended payout account " + accountId);
        return ResponseEntity.ok(account);
    }

    @PatchMapping("/owner-payout-accounts/{accountId}/block")
    public ResponseEntity<OwnerPayoutAccount> blockOwnerPayoutAccount(@PathVariable UUID accountId, Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' requested BLOCK for owner payout account ID: {}", adminName, accountId);
        
        OwnerPayoutAccount account = adminService.blockOwnerPayoutAccount(accountId);
        auditService.audit("BLOCK_PAYOUT_ACCOUNT", "OWNER_PAYOUT_ACCOUNT", accountId, "Admin " + adminName + " blocked payout account " + accountId);
        return ResponseEntity.ok(account);
    }

    @PatchMapping("/owner-payout-accounts/{accountId}/reinstate")
    public ResponseEntity<OwnerPayoutAccount> reinstateOwnerPayoutAccount(
            @PathVariable UUID accountId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        String adminName = auth != null ? auth.getName() : "anonymousAdmin";
        log.warn("[ADMIN OPERATION] Admin '{}' requested REINSTATE for owner payout account ID: {}", adminName, accountId);
        
        String verificationRef = body != null ? body.get("verificationRef") : null;
        OwnerPayoutAccount account = adminService.reinstateOwnerPayoutAccount(accountId, verificationRef);
        auditService.audit("REINSTATE_PAYOUT_ACCOUNT", "OWNER_PAYOUT_ACCOUNT", accountId, "Admin " + adminName + " reinstated payout account " + accountId);
        return ResponseEntity.ok(account);
    }

}
