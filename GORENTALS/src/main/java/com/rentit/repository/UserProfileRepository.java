package com.rentit.repository;

import com.rentit.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
    
 // Add to UserProfileRepository.java
    long countByKycStatus(UserProfile.KYCStatus status);
}