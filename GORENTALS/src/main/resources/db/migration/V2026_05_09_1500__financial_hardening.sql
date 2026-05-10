-- Phase 3: Financial Hardening Migration

-- 1. Support for automated payout retries
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;

-- 2. Webhook idempotency tracking
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    payload TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON webhook_events(event_id);

-- 3. Ensure audit logs have necessary columns (if not already there)
-- AdminAuditLog already has: admin_user_id, admin_email, action, entity_type, entity_id, description, ip_address, created_at
-- If we want to add state tracking:
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS before_state TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS after_state TEXT;
