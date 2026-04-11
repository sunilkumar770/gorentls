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

    /**
     * Case-insensitive search across email, fullName, and phone.
     * Used by the admin dashboard search bar.
     * Returns ALL users when search is blank (caller passes "%%").
     */
    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.email)    LIKE LOWER(:search)
           OR LOWER(u.fullName) LIKE LOWER(:search)
           OR LOWER(u.phone)    LIKE LOWER(:search)
        """)
    Page<User> searchAll(@Param("search") String search, Pageable pageable);

    /**
     * Same search but scoped to a specific UserType — used for Owners tab.
     */
    @Query("""
        SELECT u FROM User u
        WHERE u.userType = :userType
          AND (LOWER(u.email)    LIKE LOWER(:search)
           OR  LOWER(u.fullName) LIKE LOWER(:search)
           OR  LOWER(u.phone)    LIKE LOWER(:search))
        """)
    Page<User> searchByUserType(@Param("search") String search,
                                @Param("userType") User.UserType userType,
                                Pageable pageable);
}