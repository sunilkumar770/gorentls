package com.rentit.security;

import com.rentit.model.AdminAuditLog;
import com.rentit.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AdminAuditLogRepository auditRepo;

    @AfterReturning(pointcut = "@annotation(auditLog)", returning = "result")
    public void logAudit(JoinPoint joinPoint, AuditLog auditLog, Object result) {
        String action = auditLog.action();
        String entityType = auditLog.entityType();
        
        String email = "SYSTEM";
        UUID userId = null;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            email = auth.getName();
            // In a real system, we'd extract the UUID from the custom UserDetails
        }

        String description = "Action: " + action + " performed on method: " + joinPoint.getSignature().getName();
        
        // We can use reflection or convention to find the entity ID in the arguments
        UUID entityId = null;
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof UUID) {
                entityId = (UUID) arg;
                break;
            }
        }

        AdminAuditLog logEntry = AdminAuditLog.of(
            userId, email, action, entityType, entityId, description
        );
        
        auditRepo.save(logEntry);
        log.info("[Audit] {} | {} | {} | {} | {}", email, action, entityType, entityId, description);
    }
}
