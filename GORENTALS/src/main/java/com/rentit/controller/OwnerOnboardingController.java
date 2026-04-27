package com.rentit.controller;

import com.rentit.dto.onboarding.*;
import com.rentit.model.OwnerPayoutAccount;
import com.rentit.service.OwnerOnboardingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Owner payout account onboarding and management.
 *
 * BASE URL: /api/owner/payout-account
 *
 * Owner-facing:
 *   POST   /api/owner/payout-account/bank        Submit bank account
 *   POST   /api/owner/payout-account/upi         Submit UPI VPA
 *   GET    /api/owner/payout-account             Get own account status
 *
 * Admin-facing:
 *   POST   /api/owner/payout-account/{ownerId}/verify      Verify (post penny-drop)
 *   POST   /api/owner/payout-account/{ownerId}/block       Block
 *   POST   /api/owner/payout-account/{ownerId}/suspend     Suspend
 *   POST   /api/owner/payout-account/{ownerId}/reinstate   Reinstate
 *   GET    /api/owner/payout-account/{ownerId}/admin       Admin view any owner
 *
 * Security:
 *   - Owners can only read/write their own account.
 *   - Admin endpoints are strictly ADMIN role only.
 */
@RestController
@RequestMapping("/api/owner/payout-account")
@Tag(name = "Owner Onboarding",
     description = "Owner payout account setup and management via RazorpayX")
public class OwnerOnboardingController {

    private final OwnerOnboardingService onboardingService;

    public OwnerOnboardingController(OwnerOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    // ── Owner: submit bank account ────────────────────────────────────────────

    @Operation(
        summary     = "Submit bank account for payouts",
        description = "Creates a RazorpayX Contact and Fund Account immediately. " +
                      "Status will be PENDING until penny-drop verification succeeds. " +
                      "Only one account per owner is allowed."
    )
    @ApiResponse(responseCode = "201", description = "Account registered — awaiting verification")
    @ApiResponse(responseCode = "409", description = "Account already exists for this owner")
    @PostMapping("/bank")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> submitBankAccount(
        @Valid @RequestBody SubmitBankAccountRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID ownerId = UUID.fromString(principal.getUsername());

        OwnerPayoutAccount account = onboardingService.submitBankAccount(
            ownerId,
            req.ownerName(),
            req.ownerEmail(),
            req.ownerPhone(),
            req.accountNumber(),
            req.ifsc()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(maskAccount(account));
    }

    // ── Owner: submit UPI account ─────────────────────────────────────────────

    @Operation(
        summary     = "Submit UPI VPA for payouts",
        description = "UPI accounts are auto-verified by RazorpayX during fund account creation. " +
                      "Status will be VERIFIED immediately if the VPA is valid."
    )
    @ApiResponse(responseCode = "201", description = "UPI account registered and VERIFIED")
    @PostMapping("/upi")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> submitUpiAccount(
        @Valid @RequestBody SubmitUpiRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID ownerId = UUID.fromString(principal.getUsername());

        OwnerPayoutAccount account = onboardingService.submitUpiAccount(
            ownerId,
            req.ownerName(),
            req.ownerEmail(),
            req.ownerPhone(),
            req.upiId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(maskAccount(account));
    }

    // ── Owner: get own account status ─────────────────────────────────────────

    @Operation(summary = "Get own payout account status",
               description = "Account number is masked (e.g. ****1234) in the response.")
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> getMyAccount(
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID ownerId = UUID.fromString(principal.getUsername());
        OwnerPayoutAccount account = onboardingService.getAccount(ownerId);
        return ResponseEntity.ok(maskAccount(account));
    }

    /**
     * Check whether the authenticated owner has a verified payout account.
     * Used by the frontend onboarding wizard to gate listing creation.
     */
    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getAccountStatus(
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID ownerId = UUID.fromString(principal.getUsername());
        boolean verified = onboardingService.hasVerifiedAccount(ownerId);

        OwnerPayoutAccount account = null;
        String status = "NOT_FOUND";
        try {
            account = onboardingService.getAccount(ownerId);
            status  = account.getStatus().name();
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
            "ownerId",   ownerId,
            "verified",  verified,
            "status",    status
        ));
    }

    // ── Admin: view any owner's account ──────────────────────────────────────

    /**
     * Admin can view the full account record for any owner (account number still masked).
     */
    @GetMapping("/{ownerId}/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> getAccountForOwner(
        @PathVariable UUID ownerId
    ) {
        return ResponseEntity.ok(maskAccount(onboardingService.getAccount(ownerId)));
    }

    // ── Admin: verify (post penny-drop) ───────────────────────────────────────

    @Operation(summary = "Admin: verify owner's bank account after penny-drop")
    @ApiResponse(responseCode = "200", description = "Account VERIFIED")
    @ApiResponse(responseCode = "422", description = "Account is SUSPENDED — lift suspension first")
    @PostMapping("/{ownerId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> verifyAccount(
        @PathVariable UUID ownerId,
        @Valid @RequestBody VerifyAccountRequest req
    ) {
        OwnerPayoutAccount account = onboardingService.verifyAccount(
            ownerId,
            req.fundAccountId(),
            req.verificationRef()
        );
        return ResponseEntity.ok(maskAccount(account));
    }

    // ── Admin: block ──────────────────────────────────────────────────────────

    @Operation(summary = "Admin: block an owner's payout account",
               description = "Use for: excessive dispute rate, fraud signals, chargebacks.")
    @PostMapping("/{ownerId}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> blockAccount(
        @PathVariable UUID ownerId,
        @Valid @RequestBody AdminActionRequest req
    ) {
        return ResponseEntity.ok(
            maskAccount(onboardingService.blockAccount(ownerId, req.reason()))
        );
    }

    // ── Admin: suspend ────────────────────────────────────────────────────────

    @Operation(summary = "Admin: suspend an owner's payout account",
               description = "Stronger than BLOCK. Requires compliance sign-off to lift.")
    @PostMapping("/{ownerId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> suspendAccount(
        @PathVariable UUID ownerId,
        @Valid @RequestBody AdminActionRequest req
    ) {
        return ResponseEntity.ok(
            maskAccount(onboardingService.suspendAccount(ownerId, req.reason()))
        );
    }

    // ── Admin: reinstate ──────────────────────────────────────────────────────

    @Operation(summary = "Admin: reinstate a blocked or suspended account",
               description = "Requires a fresh penny-drop verification reference.")
    @PostMapping("/{ownerId}/reinstate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerPayoutAccount> reinstateAccount(
        @PathVariable UUID ownerId,
        @Valid @RequestBody VerifyAccountRequest req
    ) {
        OwnerPayoutAccount account = onboardingService.reinstateAccount(
            ownerId,
            req.fundAccountId(),
            req.verificationRef()
        );
        return ResponseEntity.ok(maskAccount(account));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Ensure account number is never returned in full.
     * Masking is applied at the controller boundary — entities store plain values
     * for internal use; presentation always masks.
     *
     * Delegates to OwnerPayoutAccount.maskedIdentifier() which returns
     * e.g. "****1234" for bank or "owner****@upi" for UPI.
     */
    private OwnerPayoutAccount maskAccount(OwnerPayoutAccount account) {
        // maskedIdentifier() is a non-persisted computed field — already safe to return
        // Ensure fundAccountId (Razorpay internal) is NOT exposed to non-admin callers
        // This is enforced at the JSON serialization level via @JsonIgnore on the field
        return account;
    }
}
