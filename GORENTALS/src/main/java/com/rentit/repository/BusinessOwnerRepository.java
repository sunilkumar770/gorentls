package com.rentit.repository;

import com.rentit.model.BusinessOwner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessOwnerRepository extends JpaRepository<BusinessOwner, UUID> {
    Optional<BusinessOwner> findByUserId(UUID userId);
    
    Page<BusinessOwner> findByIsVerified(Boolean isVerified, Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM BusinessOwner b WHERE b.isVerified = true")
    long countVerifiedOwners();
    
    
 // Add to BusinessOwnerRepository.java
    long countByIsVerifiedFalse();
}