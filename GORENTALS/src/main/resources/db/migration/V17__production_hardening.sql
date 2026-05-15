-- V2026_05_08__production_hardening.sql
-- Adds UserSettings and RefundOutbox tables for production stability

-- 1. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    dark_mode BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'INR'
);

-- Backfill existing users
INSERT INTO user_settings (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 2. Refund Outbox Table
CREATE TABLE IF NOT EXISTS refund_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    payment_id VARCHAR(100) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RETRYING, FAILED, COMPLETED
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_outbox_status_retry ON refund_outbox(status, next_retry_at);
