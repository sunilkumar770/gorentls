-- ============================================================
--  V1 — GoRentals Baseline Schema
--  Managed by Flyway.  DO NOT modify this file once applied.
--  For changes, create V2__description.sql, V3__description.sql, etc.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    user_type     VARCHAR(20)  NOT NULL DEFAULT 'RENTER',
    full_name     VARCHAR(255),
    phone         VARCHAR(20),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── user_profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_picture    TEXT,
    date_of_birth      DATE,
    address            TEXT,
    city               VARCHAR(100),
    state              VARCHAR(100),
    pincode            VARCHAR(20),
    kyc_status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    kyc_document_type  VARCHAR(100),
    kyc_document_id    VARCHAR(255),
    kyc_document_url   TEXT,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_profiles_user UNIQUE (user_id)
);

-- ── admin_users ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(100) NOT NULL DEFAULT 'ADMIN',
    permissions JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admin_users_user UNIQUE (user_id)
);

-- ── business_owners ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_owners (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name       VARCHAR(255) NOT NULL,
    business_type       VARCHAR(100),
    business_address    TEXT,
    business_city       VARCHAR(100),
    business_state      VARCHAR(100),
    business_pincode    VARCHAR(20),
    business_phone      VARCHAR(20),
    business_email      VARCHAR(255),
    gst_number          VARCHAR(50),
    pan_number          VARCHAR(20),
    registration_number VARCHAR(100),
    is_verified         BOOLEAN   NOT NULL DEFAULT FALSE,
    commission_rate     NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_business_owners_user UNIQUE (user_id)
);

-- ── listings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id         UUID NOT NULL REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(100),
    type             VARCHAR(100),
    price_per_day    NUMERIC(12,2) NOT NULL,
    security_deposit NUMERIC(12,2),
    location         VARCHAR(255),
    city             VARCHAR(100),
    state            VARCHAR(100),
    latitude         NUMERIC(10,7),
    longitude        NUMERIC(10,7),
    specifications   JSONB,
    images           JSONB,
    is_available     BOOLEAN   NOT NULL DEFAULT TRUE,
    is_published     BOOLEAN   NOT NULL DEFAULT FALSE,
    total_ratings    NUMERIC(5,2) NOT NULL DEFAULT 0,
    rating_count     INTEGER   NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_owner    ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_city     ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_published ON listings(is_published, is_available);

-- ── bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id          UUID NOT NULL REFERENCES listings(id),
    renter_id           UUID NOT NULL REFERENCES users(id),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    total_days          INTEGER NOT NULL,
    rental_amount       NUMERIC(12,2) NOT NULL,
    security_deposit    NUMERIC(12,2) NOT NULL,
    total_amount        NUMERIC(12,2) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_listing ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter  ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);

-- ── payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    amount              NUMERIC(12,2) NOT NULL,
    payment_type        VARCHAR(50),
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    status              VARCHAR(20),
    payment_method      VARCHAR(50),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255),
    message    TEXT,
    type       VARCHAR(50),
    is_read    BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ── conversations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id   UUID REFERENCES listings(id),
    owner_id     UUID NOT NULL REFERENCES users(id),
    renter_id    UUID NOT NULL REFERENCES users(id),
    booking_id   UUID REFERENCES bookings(id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT,
    is_read         BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ── admin_audit_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID,
    admin_email   VARCHAR(255),
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(100),
    entity_id     UUID,
    description   TEXT,
    ip_address    VARCHAR(45),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_user  ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action      ON admin_audit_logs(action);
