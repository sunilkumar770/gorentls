-- ============================================================
-- V8: Dispute + Payout + Owner Payout Account tables (FINAL)
-- GoRentals escrow system — Phase 1
--
-- NOTE: This migration is IDEMPOTENT. It safely handles:
--   1. Fresh databases (creates everything)
--   2. Databases that already have V7 applied (VARCHAR columns)
--   3. Partial application (some objects exist, some don't)
-- ============================================================

-- ── Drop and recreate enum types (safe: no columns use them yet in fresh DB) ──

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
        CREATE TYPE dispute_status AS ENUM (
            'OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND',
            'RESOLVED_PAYOUT', 'RESOLVED_SPLIT', 'REJECTED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE payout_status AS ENUM (
            'PENDING', 'INITIATED', 'SUCCESS', 'FAILED', 'ON_HOLD'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_onboarding_status') THEN
        CREATE TYPE payout_onboarding_status AS ENUM (
            'PENDING', 'VERIFIED', 'BLOCKED', 'SUSPENDED'
        );
    END IF;
END $$;

-- ── CRITICAL FIX: 'FULL_HELD' not 'FULLY_HELD' ──────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_status') THEN
        CREATE TYPE escrow_status AS ENUM (
            'PENDING',
            'ADVANCE_HELD',
            'FULL_HELD',
            'ON_HOLD',
            'READY_FOR_PAYOUT',
            'PAID_OUT',
            'REFUNDED',
            'PARTIALLY_REFUNDED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_account') THEN
        CREATE TYPE ledger_account AS ENUM (
            'RENTER_ESCROW', 'OWNER_ESCROW', 'PLATFORM_FEE',
            'GST', 'TDS', 'SECURITY_DEPOSIT'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_kind') THEN
        CREATE TYPE payment_kind AS ENUM (
            'ADVANCE', 'FINAL', 'SECURITY_DEPOSIT'
        );
    END IF;
END $$;

-- ── Ledger transactions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID            NOT NULL
                                    REFERENCES bookings(id)
                                    ON DELETE RESTRICT,
    account         ledger_account  NOT NULL,
    amount          NUMERIC(14, 2)  NOT NULL,
    description     VARCHAR(500)    NOT NULL,
    reference_id    VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_booking
    ON ledger_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_booking_acct
    ON ledger_transactions(booking_id, account);

-- ── Disputes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disputes (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID            NOT NULL
                                    REFERENCES bookings(id)
                                    ON DELETE RESTRICT,
    opened_by       UUID            NOT NULL,
    opened_by_role  VARCHAR(10)     NOT NULL
                                    CHECK (opened_by_role IN ('RENTER', 'OWNER')),
    status          dispute_status  NOT NULL DEFAULT 'OPEN',
    reason_code     VARCHAR(50)     NOT NULL,
    description     TEXT            NOT NULL,
    evidence_urls   TEXT[],
    resolved_by     UUID,
    resolved_at     TIMESTAMPTZ,
    owner_amount    NUMERIC(14, 2),
    renter_amount   NUMERIC(14, 2),
    resolution_notes TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_booking_active
    ON disputes(booking_id)
    WHERE status IN ('OPEN', 'UNDER_REVIEW');

CREATE INDEX IF NOT EXISTS idx_disputes_status_created
    ON disputes(status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_disputes_opened_by
    ON disputes(opened_by);

-- ── Owner payout accounts ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS owner_payout_accounts (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID                    NOT NULL UNIQUE
                                                REFERENCES users(id)
                                                ON DELETE RESTRICT,
    status              payout_onboarding_status NOT NULL DEFAULT 'PENDING',
    account_type        VARCHAR(10)             NOT NULL
                                                CHECK (account_type IN ('BANK', 'UPI')),
    account_number      VARCHAR(20),
    ifsc                VARCHAR(11),
    upi_id              VARCHAR(256),
    fund_account_id     VARCHAR(100),
    verification_ref    VARCHAR(255),
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_owner_status
    ON owner_payout_accounts(owner_id, status);

-- ── Payouts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payouts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID            NOT NULL
                                    REFERENCES bookings(id)
                                    ON DELETE RESTRICT,
    owner_id        UUID            NOT NULL
                                    REFERENCES users(id)
                                    ON DELETE RESTRICT,
    status          payout_status   NOT NULL DEFAULT 'PENDING',
    gross_amount    NUMERIC(14, 2)  NOT NULL,
    tds_amount      NUMERIC(14, 2)  NOT NULL DEFAULT 0,
    net_amount      NUMERIC(14, 2)  NOT NULL,
    fund_account_id VARCHAR(100)    NOT NULL,
    rp_payout_id    VARCHAR(100),
    scheduled_at    TIMESTAMPTZ     NOT NULL,
    executed_at     TIMESTAMPTZ,
    failure_reason  VARCHAR(255),
    retry_count     SMALLINT        NOT NULL DEFAULT 0,
    last_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_booking
    ON payouts(booking_id);

CREATE INDEX IF NOT EXISTS idx_payouts_status_scheduled
    ON payouts(status, scheduled_at ASC)
    WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_payouts_rp_payout_id
    ON payouts(rp_payout_id)
    WHERE rp_payout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payouts_owner_status_executed
    ON payouts(owner_id, status, executed_at)
    WHERE status = 'SUCCESS';

-- ── Migrate bookings columns from VARCHAR (V7) to ENUM (V8) ───────────────────
-- This is safe to run even on fresh DBs where columns don't yet exist.
-- On DBs with V7 applied, it converts the columns to the new enum type.
-- On fresh DBs, the columns are created by earlier migrations or by V7.

DO $$ 
BEGIN
    -- Only convert if the column exists as VARCHAR (from V7)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'escrow_status' 
        AND data_type = 'character varying'
    ) THEN
        -- Drop default first to avoid casting error
        ALTER TABLE bookings ALTER COLUMN escrow_status DROP DEFAULT;
        -- Convert existing VARCHAR values to the enum, mapping NONE to PENDING
        ALTER TABLE bookings 
            ALTER COLUMN escrow_status 
            TYPE escrow_status 
            USING (CASE WHEN escrow_status = 'NONE' THEN 'PENDING' ELSE escrow_status END)::escrow_status;
        -- Re-add default
        ALTER TABLE bookings ALTER COLUMN escrow_status SET DEFAULT 'PENDING'::escrow_status;
    END IF;
    
    -- Ensure column exists (for fresh DBs, V7 or baseline should have added it,
    -- but if this is a truly fresh DB without V7, add it now)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'escrow_status'
    ) THEN
        ALTER TABLE bookings 
            ADD COLUMN escrow_status escrow_status NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

-- ── Update trigger for auto-updating updated_at ───────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_disputes_updated_at'
    ) THEN
        CREATE TRIGGER trg_disputes_updated_at
            BEFORE UPDATE ON disputes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_payout_accounts_updated_at'
    ) THEN
        CREATE TRIGGER trg_payout_accounts_updated_at
            BEFORE UPDATE ON owner_payout_accounts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_payouts_updated_at'
    ) THEN
        CREATE TRIGGER trg_payouts_updated_at
            BEFORE UPDATE ON payouts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
