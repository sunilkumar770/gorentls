package com.rentit.repository;

import com.rentit.model.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
    
    Page<UserProfile> findByKycStatus(UserProfile.KYCStatus status, Pageable pageable);
    
    long countByKycStatus(UserProfile.KYCStatus status);
}
