package com.rentit.service;

import com.rentit.model.AdminAuditLog;
import com.rentit.repository.AdminAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

/**
 * Centralized service for administrative auditing.
 * Hardens the platform by ensuring consistent tracking of all sensitive actions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AdminAuditLogRepository auditLogRepository;

    /**
     * Records an administrative action asynchronously.
     * Captures IP address from the current request context if available.
     */
    @Async
    public void audit(String action, String entityType, UUID entityId, String description) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "system";
            
            String ip = null;
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ip = request.getRemoteAddr();
                // Check for proxy headers if behind a load balancer
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isEmpty()) {
                    ip = forwarded.split(",")[0];
                }
            }

            AdminAuditLog entry = AdminAuditLog.of(null, email, action, entityType, entityId, description);
            entry.setIpAddress(ip);
            
            auditLogRepository.save(entry);
            log.debug("AUDIT: [{}] by {} on {}:{} - {}", action, email, entityType, entityId, description);
        } catch (Exception e) {
            log.error("Failed to record audit log for action {}: {}", action, e.getMessage());
        }
    }
    
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
