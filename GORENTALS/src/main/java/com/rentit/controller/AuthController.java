package com.rentit.controller;

import com.rentit.dto.*;
import com.rentit.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register-owner")
    public ResponseEntity<AuthResponse> registerOwner(@Valid @RequestBody OwnerRegistrationRequest request) {
        AuthResponse response = authService.registerOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/admin-login")
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody TokenRefreshRequest request) {
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<SuccessResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.initiatePasswordReset(request.getEmail());
        return ResponseEntity.ok(new SuccessResponse(
                "If the account exists, a password reset email has been sent", true
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<SuccessResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new SuccessResponse("Password has been reset successfully", true));
    }

    /**
     * POST /api/auth/logout
     * Clears the HttpOnly JWT cookie server-side.
     * Note: JWTs are stateless; full server-side token invalidation requires
     * a Redis-backed token blacklist. The current implementation relies on
     * frontend cookie clearing and short token expiry (24h) as the primary
     * logout mechanism.
     */
    @PostMapping("/logout")
    public ResponseEntity<SuccessResponse> logout(HttpServletResponse response) {
        // Clear the JWT HttpOnly cookie
        Cookie cookie = new Cookie("gorentals_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // HTTPS only
        cookie.setPath("/");
        cookie.setMaxAge(0);    // Expire immediately
        response.addCookie(cookie);

        // Also clear legacy token cookie if present
        Cookie legacyCookie = new Cookie("token", "");
        legacyCookie.setHttpOnly(true);
        legacyCookie.setSecure(true);
        legacyCookie.setPath("/");
        legacyCookie.setMaxAge(0);
        response.addCookie(legacyCookie);

        return ResponseEntity.ok(new SuccessResponse("Logged out successfully", true));
    }
}
