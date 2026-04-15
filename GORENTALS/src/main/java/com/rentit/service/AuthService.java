package com.rentit.service;

import com.rentit.dto.*;
import com.rentit.model.*;
import com.rentit.repository.*;
import com.rentit.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private BusinessOwnerRepository businessOwnerRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        try {
          user.setUserType(User.UserType.valueOf(request.getUserType().toUpperCase()));
        } catch (IllegalArgumentException e) {
          user.setUserType(User.UserType.RENTER);
        }
        
        
        User savedUser = userRepository.save(user);

        // Create user profile
        UserProfile profile = new UserProfile();
        profile.setUser(savedUser);
        userProfileRepository.save(profile);

        // Generate tokens
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getUserType().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userType(user.getUserType().name())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .userId(savedUser.getId())
                .build();
    }

    @Transactional
    public AuthResponse registerOwner(OwnerRegistrationRequest request) {
        // First register as renter
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail(request.getEmail());
        registerRequest.setPassword(request.getPassword());
        registerRequest.setFullName(request.getFullName());
        registerRequest.setPhone(request.getPhone());
        registerRequest.setUserType("OWNER");
        
        AuthResponse authResponse = register(registerRequest);
        
        // Get the user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create business owner details
        BusinessOwner businessOwner = new BusinessOwner();
        businessOwner.setUser(user);
        businessOwner.setBusinessName(request.getBusinessName());
        businessOwner.setBusinessType(request.getBusinessType());
        businessOwner.setBusinessAddress(request.getBusinessAddress());
        businessOwner.setBusinessCity(request.getBusinessCity());
        businessOwner.setBusinessState(request.getBusinessState());
        businessOwner.setBusinessPincode(request.getBusinessPincode());
        businessOwner.setBusinessPhone(request.getBusinessPhone());
        businessOwner.setBusinessEmail(request.getBusinessEmail());
        businessOwner.setGstNumber(request.getGstNumber());
        businessOwner.setPanNumber(request.getPanNumber());
        businessOwner.setRegistrationNumber(request.getRegistrationNumber());
        
        businessOwnerRepository.save(businessOwner);
        
        // Update user type
        user.setUserType(User.UserType.OWNER);
        userRepository.save(user);
        
        // Generate new token with updated role
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getUserType().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        
        authResponse.setAccessToken(accessToken);
        authResponse.setRefreshToken(refreshToken);
        authResponse.setUserType(User.UserType.OWNER.name());
        
        return authResponse;
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            String accessToken = jwtUtil.generateToken(user.getEmail(), user.getUserType().name());
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
            
            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .userType(user.getUserType().name())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .userId(user.getId())
                    .build();
                    
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }
    }

    public AuthResponse adminLogin(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        adminUserRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Not an admin user"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail(), "ADMIN");
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userType("ADMIN")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .userId(user.getId())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!jwtUtil.validateToken(refreshToken, email)) {
            throw new RuntimeException("Invalid refresh token");
        }
        
        String newAccessToken = jwtUtil.generateToken(email, user.getUserType().name());
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