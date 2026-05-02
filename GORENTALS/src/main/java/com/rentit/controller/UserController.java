package com.rentit.controller;

import com.rentit.dto.AuthResponse;
import com.rentit.dto.ChangePasswordRequest;
import com.rentit.dto.KYCSubmissionRequest;
import com.rentit.dto.UpdateProfileRequest;
import com.rentit.dto.UpdateSettingsRequest;
import com.rentit.dto.UserProfileResponse;

import com.rentit.dto.SuccessResponse;
import com.rentit.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * GET /api/users/me
     * Returns the full profile of the currently authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        String email = getAuthenticatedEmail();
        return ResponseEntity.ok(userService.getProfile(email));
    }

    /**
     * PATCH /api/users/profile
     * Updates the authenticated user's name, phone, and location details.
     */
    @PatchMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String email = getAuthenticatedEmail();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    /**
     * PATCH /api/users/settings
     * Updates notification and account-level settings for the authenticated user.
     */
    @PatchMapping("/settings")
    public ResponseEntity<UserProfileResponse> updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        String email = getAuthenticatedEmail();
        return ResponseEntity.ok(userService.updateSettings(email, request));
    }

    /**
     * POST /api/users/password
     * Changes the current user's password.
     */
    @PostMapping("/password")
    public ResponseEntity<SuccessResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = getAuthenticatedEmail();
        userService.changePassword(email, request);
        return ResponseEntity.ok(new SuccessResponse("Password changed successfully", true));
    }

    /**
     * POST /api/users/kyc
     * Submits KYC verification details.
     */
    @PostMapping("/kyc")
    public ResponseEntity<UserProfileResponse> submitKYC(@Valid @RequestBody KYCSubmissionRequest request) {
        String email = getAuthenticatedEmail();
        return ResponseEntity.ok(userService.submitKYC(email, request));
    }

    /**
     * POST /api/users/upgrade
     * Upgrades the current user from RENTER to OWNER.
     */
    @PostMapping("/upgrade")
    public ResponseEntity<AuthResponse> upgradeToOwner(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.upgradeToOwner(authentication.getName()));
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Not authenticated");
        }
        return authentication.getName();
    }
}
