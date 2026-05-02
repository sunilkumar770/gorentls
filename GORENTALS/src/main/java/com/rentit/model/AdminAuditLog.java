package com.rentit.model;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable audit trail of every admin action.
 * Written asynchronously so it never blocks the main request.
 */
@Data
@Entity
@Table(name = "admin_audit_logs", indexes = {
    @Index(name = "idx_audit_admin_user", columnList = "admin_user_id"),
    @Index(name = "idx_audit_created_at", columnList = "created_at"),
    @Index(name = "idx_audit_action", columnList = "action")
})
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** The admin user who performed the action */
    @Column(name = "admin_user_id")
    private UUID adminUserId;

    @Column(name = "admin_email", length = 255)
    private String adminEmail;

    /** A machine-readable action code, e.g. SUSPEND_USER, APPROVE_LISTING */
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    /** The entity type affected, e.g. USER, LISTING, BOOKING */
    @Column(name = "entity_type", length = 100)
    private String entityType;

    /** The UUID of the entity that was acted upon */
    @Column(name = "entity_id")
    private UUID entityId;

    /** Human-readable description of what changed */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** IP address of the request originator (optional) */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ── Convenience factory ───────────────────────────────────────────────────

    public static AdminAuditLog of(UUID adminUserId, String adminEmail,
                                   String action, String entityType,
                                   UUID entityId, String description) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminUserId(adminUserId);
        log.setAdminEmail(adminEmail);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDescription(description);
        return log;
    }

    // ── Getters / Setters (Lombok @Data covers these, but explicit for clarity) ─
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAdminUserId() { return adminUserId; }
    public void setAdminUserId(UUID adminUserId) { this.adminUserId = adminUserId; }
    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
