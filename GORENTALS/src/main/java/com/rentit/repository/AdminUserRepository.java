package com.rentit.repository;

import com.rentit.model.AdminUser;
import com.rentit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {
    Optional<AdminUser> findByUser(User user);
    Optional<AdminUser> findByUserId(UUID userId);
}
