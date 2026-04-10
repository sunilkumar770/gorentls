package com.rentit.repository;

import com.rentit.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
 // Add this method to UserRepository.java
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt < :date")
    long countByCreatedAtBefore(@Param("date") LocalDateTime date);
    
    Page<User> findByUserType(User.UserType userType, Pageable pageable);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'OWNER'")
    long countOwners();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'RENTER'")
    long countRenters();
    
    @Query("SELECT u FROM User u WHERE u.userType = 'OWNER' AND u.isActive = true")
    Page<User> findAllActiveOwners(Pageable pageable);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.userType = 'OWNER' AND u.createdAt >= :date")
    long countOwnersByCreatedAtAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    
}