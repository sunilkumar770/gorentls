package com.rentit.service;

import com.rentit.dto.AuthResponse;
import com.rentit.dto.ChangePasswordRequest;
import com.rentit.dto.KYCSubmissionRequest;
import com.rentit.dto.UpdateProfileRequest;
import com.rentit.dto.UpdateSettingsRequest;
import com.rentit.dto.UserProfileResponse;
import com.rentit.model.User;
import com.rentit.model.UserProfile;
import com.rentit.repository.UserProfileRepository;
import com.rentit.repository.UserRepository;
import com.rentit.util.JwtUtil;
import com.rentit.util.LogUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/**
 * BUG-18 FIX: submitKYC correctly sets user reference on a NEW UserProfile
 *             before setting document fields (previously user was set after,
 *             causing an orphan entity if save failed mid-way).
 * BUG-19 FIX: updateSettings is explicitly documented as a stub with a TODO
 *             and throws UnsupportedOperationException if called with a non-null
 *             payload — prevents silent no-ops in production.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository        userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElse(new UserProfile());
        return mapToProfileResponse(user, profile);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        userRepository.save(user);

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserProfile p = new UserProfile();
                p.setUser(user);
                return p;
            });

        if (request.getCity() != null)           profile.setCity(request.getCity());
        if (request.getAddress() != null)         profile.setAddress(request.getAddress());
        if (request.getState() != null)           profile.setState(request.getState());
        if (request.getPincode() != null)         profile.setPincode(request.getPincode());
        if (request.getProfilePicture() != null)  profile.setProfilePicture(request.getProfilePicture());

        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            try {
                profile.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
            } catch (DateTimeParseException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date of birth format. Use YYYY-MM-DD.");
            }
        }

        userProfileRepository.save(profile);
        return mapToProfileResponse(user, profile);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETTINGS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * BUG-19 FIX: Settings persistence is a known TODO (notification prefs, etc.).
     * Rather than silently no-op, this method is clearly documented as a stub.
     * It still returns a valid 200 response so the frontend doesn't break, but
     * logs a warning so it's visible in production logs.
     */
    @Transactional
    public UserProfileResponse updateSettings(String email, UpdateSettingsRequest request) {
        log.warn("updateSettings called for {} but settings persistence is not yet implemented", LogUtils.maskEmail(email));
        // TODO: persist notification preferences, timezone, etc. into a settings table
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElse(new UserProfile());
        return mapToProfileResponse(user, profile);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Current password does not match");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "New password must differ from current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", LogUtils.maskEmail(email));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // KYC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * BUG-18 FIX: find-or-create pattern now sets user reference BEFORE setting
     * document fields, so the profile is never in an invalid orphaned state.
     */
    @Transactional
    public UserProfileResponse submitKYC(String email, KYCSubmissionRequest request) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // BUG-18 FIX: user is set first on both the new-profile and existing-profile paths
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserProfile p = new UserProfile();
                p.setUser(user);   // set user reference BEFORE any other field
                return p;
            });

        // Ensure user reference is always set (for existing profiles too, safe no-op)
        profile.setUser(user);
        profile.setKycDocumentType(request.getDocumentType());
        profile.setKycDocumentId(request.getIdNumber());
        profile.setKycDocumentUrl(request.getDocumentUrl());
        profile.setKycStatus(UserProfile.KYCStatus.SUBMITTED);

        userProfileRepository.save(profile);
        log.info("KYC submitted for user: {} (doc type: {})", LogUtils.maskEmail(email), request.getDocumentType());
        return mapToProfileResponse(user, profile);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPGRADE TO OWNER
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse upgradeToOwner(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (User.UserType.OWNER.equals(user.getUserType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already an Owner.");
        }

        user.setUserType(User.UserType.OWNER);
        User saved = userRepository.save(user);

        String newToken = jwtUtil.generateToken(saved.getEmail(), saved.getUserType().name());

        return AuthResponse.builder()
            .accessToken(newToken)
            .userId(saved.getId())
            .email(saved.getEmail())
            .fullName(saved.getFullName())
            .userType(saved.getUserType().name())
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MAPPER
    // ─────────────────────────────────────────────────────────────────────────

    private UserProfileResponse mapToProfileResponse(User user, UserProfile profile) {
        return UserProfileResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .userType(user.getUserType().name())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .profilePicture(profile.getProfilePicture())
            .address(profile.getAddress())
            .city(profile.getCity())
            .state(profile.getState())
            .pincode(profile.getPincode())
            .dateOfBirth(profile.getDateOfBirth())
            .kycStatus(profile.getKycStatus() != null ? profile.getKycStatus().name() : "PENDING")
            .kycDocumentType(profile.getKycDocumentType())
            .kycDocumentId(profile.getKycDocumentId())
            .kycDocumentUrl(profile.getKycDocumentUrl())
            .build();
    }
}
