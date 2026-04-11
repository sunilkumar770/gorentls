package com.rentit.repository;

import com.rentit.model.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, UUID> {

    /** All logs for a specific admin user, newest first */
    Page<AdminAuditLog> findByAdminUserIdOrderByCreatedAtDesc(UUID adminUserId, Pageable pageable);

    /** All logs for a specific action type, e.g. SUSPEND_USER */
    Page<AdminAuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);
}
