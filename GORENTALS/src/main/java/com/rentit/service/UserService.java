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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElse(new UserProfile());

        return mapToProfileResponse(user, profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update fields on the User entity
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone());
        }
        userRepository.save(user);

        // Update UserProfile entity
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setUser(user);
                    return p;
                });

        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getState() != null) profile.setState(request.getState());
        if (request.getPincode() != null) profile.setPincode(request.getPincode());
        if (request.getProfilePicture() != null) profile.setProfilePicture(request.getProfilePicture());
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            profile.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        }
        userProfileRepository.save(profile);

        return mapToProfileResponse(user, profile);
    }

    @Transactional
    public UserProfileResponse updateSettings(String email, UpdateSettingsRequest request) {
        // Settings like notification prefs would be stored in UserProfile or a dedicated table.
        // For now, we return the current user state as a no-op that signals success.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElse(new UserProfile());
        return mapToProfileResponse(user, profile);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserProfileResponse submitKYC(String email, KYCSubmissionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElse(new UserProfile());

        profile.setUser(user);
        profile.setKycDocumentType(request.getDocumentType());
        profile.setKycDocumentId(request.getIdNumber());
        profile.setKycDocumentUrl(request.getDocumentUrl());
        profile.setKycStatus(UserProfile.KYCStatus.SUBMITTED);
        
        userProfileRepository.save(profile);
        return mapToProfileResponse(user, profile);
    }

    @Transactional
    public AuthResponse upgradeToOwner(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (User.UserType.OWNER.equals(user.getUserType())) {
            throw new IllegalStateException("Already an Owner.");
        }
        
        user.setUserType(User.UserType.OWNER);
        User saved = userRepository.save(user);
        
        String newToken = jwtUtil.generateToken(saved.getEmail(), saved.getUserType().name()); // new JWT with OWNER role
        
        return AuthResponse.builder()
                .accessToken(newToken)
                .userId(saved.getId())
                .email(saved.getEmail())
                .fullName(saved.getFullName())
                .userType(saved.getUserType().name())
                .build();
    }

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
