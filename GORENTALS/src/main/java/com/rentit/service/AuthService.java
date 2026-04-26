package com.rentit.service;

import com.rentit.dto.*;
import com.rentit.model.*;
import com.rentit.repository.*;
import com.rentit.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles registration, login, and token management.
 *
 * BUG-11 FIX: duplicate email → 409 Conflict (was bare RuntimeException → 500)
 * BUG-12 FIX: login() no longer swallows all exceptions; only
 *             BadCredentialsException is translated to a 401.
 * BUG-13 FIX: adminLogin() now delegates to AuthenticationManager so it goes
 *             through Spring Security's brute-force-protection chain.
 * BUG-14 FIX: registerOwner() is a single @Transactional method; the
 *             user is created with OWNER type from the start — no race window.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepository;
    private final UserProfileRepository  userProfileRepository;
    private final BusinessOwnerRepository businessOwnerRepository;
    private final AdminUserRepository    adminUserRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtUtil                jwtUtil;
    private final AuthenticationManager  authenticationManager;

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // BUG-11 FIX: 409 Conflict, not 500
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An account with this email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());

        // Default to RENTER; accept OWNER for unified /register if explicitly sent
        try {
            user.setUserType(User.UserType.valueOf(
                request.getUserType() != null
                    ? request.getUserType().toUpperCase()
                    : "RENTER"));
        } catch (IllegalArgumentException e) {
            user.setUserType(User.UserType.RENTER);
        }

        User savedUser = userRepository.save(user);

        // Always create a blank UserProfile row
        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        userProfileRepository.save(profile);

        String accessToken  = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getUserType().name());
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getEmail());

        log.info("New user registered: {} ({})", savedUser.getEmail(), savedUser.getUserType());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .userType(savedUser.getUserType().name())
            .email(savedUser.getEmail())
            .fullName(savedUser.getFullName())
            .userId(savedUser.getId())
            .build();
    }

    /**
     * Register an owner account in a single atomic transaction.
     *
     * BUG-14 FIX: previously called register() (RENTER) then set OWNER in a
     * second save — two separate DB writes created a race window. Now the user
     * is created as OWNER directly within one transaction.
     */
    @Transactional
    public AuthResponse registerOwner(OwnerRegistrationRequest request) {
        // BUG-11 FIX (also applies here): 409 on duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An account with this email already exists");
        }

        // Create user as OWNER from the start (no intermediate RENTER state)
        User user = new User();
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setUserType(User.UserType.OWNER);

        User savedUser = userRepository.save(user);

        // Blank user profile
        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        userProfileRepository.save(profile);

        // Business owner details
        BusinessOwner bo = new BusinessOwner();
        bo.setUser(savedUser);
        bo.setBusinessName(request.getBusinessName());
        bo.setBusinessType(request.getBusinessType());
        bo.setBusinessAddress(request.getBusinessAddress());
        bo.setBusinessCity(request.getBusinessCity());
        bo.setBusinessState(request.getBusinessState());
        bo.setBusinessPincode(request.getBusinessPincode());
        bo.setBusinessPhone(request.getBusinessPhone());
        bo.setBusinessEmail(request.getBusinessEmail());
        bo.setGstNumber(request.getGstNumber());
        bo.setPanNumber(request.getPanNumber());
        bo.setRegistrationNumber(request.getRegistrationNumber());
        businessOwnerRepository.save(bo);

        String accessToken  = jwtUtil.generateToken(savedUser.getEmail(), "OWNER");
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getEmail());

        log.info("Owner registered: {} (business: {})",
            savedUser.getEmail(), request.getBusinessName());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .userType("OWNER")
            .email(savedUser.getEmail())
            .fullName(savedUser.getFullName())
            .userId(savedUser.getId())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * BUG-12 FIX: no longer catches (Exception e) to swallow DB errors.
     * Only BadCredentialsException is caught and translated to 401.
     * All other exceptions propagate naturally to GlobalExceptionHandler.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Your account has been deactivated. Contact support.");
        }

        String accessToken  = jwtUtil.generateToken(user.getEmail(), user.getUserType().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .userType(user.getUserType().name())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userId(user.getId())
            .build();
    }

    /**
     * Admin login.
     *
     * BUG-13 FIX: now uses AuthenticationManager (same Spring Security chain
     * as regular login) before checking admin role, so brute-force protection,
     * account-lock events, and audit logs apply equally.
     */
    @Transactional(readOnly = true)
    public AuthResponse adminLogin(LoginRequest request) {
        // Run through Spring Security's authentication chain first
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid credentials");
        }

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Invalid credentials"));

        // Verify admin row exists
        adminUserRepository.findByUser(user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Access denied: not an admin account"));

        String accessToken  = jwtUtil.generateToken(user.getEmail(), "ADMIN");
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        log.info("Admin login: {}", user.getEmail());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .userType("ADMIN")
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userId(user.getId())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOKEN REFRESH
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);

        if (!jwtUtil.validateToken(refreshToken, email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Refresh token is expired or invalid");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "User not found for refresh token"));

        String newAccessToken  = jwtUtil.generateToken(email, user.getUserType().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(email);

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .userType(user.getUserType().name())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userId(user.getId())
            .build();
    }
}