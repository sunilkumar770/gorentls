-- ============================================================
-- V8: Dispute + Payout + Owner Payout Account tables
-- GoRentals escrow system — Phase 1
-- ============================================================

-- ── Enum types ────────────────────────────────────────────────────────────────

CREATE TYPE dispute_status AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED_REFUND',
    'RESOLVED_PAYOUT',
    'RESOLVED_SPLIT',
    'REJECTED'
);

CREATE TYPE payout_status AS ENUM (
    'PENDING',
    'INITIATED',
    'SUCCESS',
    'FAILED',
    'ON_HOLD'
);

CREATE TYPE payout_onboarding_status AS ENUM (
    'PENDING',
    'VERIFIED',
    'BLOCKED',
    'SUSPENDED'
);

CREATE TYPE escrow_status AS ENUM (
    'PENDING',
    'ADVANCE_HELD',
    'FULLY_HELD',
    'ON_HOLD',
    'READY_FOR_PAYOUT',
    'PAID_OUT',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CANCELLED'
);

CREATE TYPE ledger_account AS ENUM (
    'RENTER_ESCROW',
    'OWNER_ESCROW',
    'PLATFORM_FEE',
    'GST',
    'TDS',
    'SECURITY_DEPOSIT'
);

CREATE TYPE payment_kind AS ENUM (
    'ADVANCE',
    'FINAL',
    'SECURITY_DEPOSIT'
);

-- ── Ledger transactions ───────────────────────────────────────────────────────

CREATE TABLE ledger_transactions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID            NOT NULL
                                    REFERENCES bookings(id)
                                    ON DELETE RESTRICT,
    account         ledger_account  NOT NULL,
    -- Positive = credit (money in), Negative = debit (money out)
    amount          NUMERIC(14, 2)  NOT NULL,
    description     VARCHAR(500)    NOT NULL,
    reference_id    VARCHAR(255),   -- razorpay payment/refund/payout ID
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Performance: balance queries always filter by booking_id
CREATE INDEX idx_ledger_booking     ON ledger_transactions(booking_id);
-- Balance rollup: booking + account
CREATE INDEX idx_ledger_booking_acct ON ledger_transactions(booking_id, account);

COMMENT ON TABLE ledger_transactions IS
    'Immutable double-entry ledger. Credits are positive, debits are negative. '
    'Never UPDATE or DELETE rows — use compensating entries.';

-- ── Disputes ─────────────────────────────────────────────────────────────────

CREATE TABLE disputes (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID            NOT NULL
                                    REFERENCES bookings(id)
                                    ON DELETE RESTRICT,
    opened_by       UUID            NOT NULL,   -- user ID
    opened_by_role  VARCHAR(10)     NOT NULL    -- 'RENTER' | 'OWNER'
                                    CHECK (opened_by_role IN ('RENTER', 'OWNER')),
    status          dispute_status  NOT NULL    DEFAULT 'OPEN',
    reason_code     VARCHAR(50)     NOT NULL,
    description     TEXT            NOT NULL,
    evidence_urls   TEXT[],                     -- S3/GCS URL array
    -- Resolution fields (null until resolved)
    resolved_by     UUID,
    resolved_at     TIMESTAMPTZ,
    owner_amount    NUMERIC(14, 2),
    renter_amount   NUMERIC(14, 2),
    resolution_notes TEXT,
    -- Timestamps
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- One active dispute per booking at a time
CREATE UNIQUE INDEX idx_disputes_booking_active
    ON disputes(booking_id)
    WHERE status IN ('OPEN', 'UNDER_REVIEW');

-- Admin queue lookup
CREATE INDEX idx_disputes_status_created
    ON disputes(status, created_at ASC);

-- Lookup by opening user
CREATE INDEX idx_disputes_opened_by
    ON disputes(opened_by);

COMMENT ON TABLE disputes IS
    'Rental disputes raised by renter or owner. One active dispute per booking.';

-- ── Owner payout accounts ─────────────────────────────────────────────────────

CREATE TABLE owner_payout_accounts (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID                    NOT NULL UNIQUE
                                                REFERENCES users(id)
                                                ON DELETE RESTRICT,
    status              payout_onboarding_status NOT NULL DEFAULT 'PENDING',
    account_type        VARCHAR(10)             NOT NULL    -- 'BANK' | 'UPI'
                                                CHECK (account_type IN ('BANK', 'UPI')),
    -- Bank account fields (null for UPI accounts)
    account_number      VARCHAR(20),
    ifsc                VARCHAR(11),
    -- UPI field (null for bank accounts)
    upi_id              VARCHAR(256),
    -- RazorpayX identifiers
    fund_account_id     VARCHAR(100),           -- fa_xxxxx
    -- Verification audit
    verification_ref    VARCHAR(255),
    verified_at         TIMESTAMPTZ,
    -- Timestamps
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now()
);

-- Status lookup for PayoutEngine
CREATE INDEX idx_payout_accounts_owner_status
    ON owner_payout_accounts(owner_id, status);

COMMENT ON TABLE owner_payout_accounts IS
    'Owner bank/UPI accounts used for payouts via RazorpayX. '
    'One account per owner (UNIQUE on owner_id).';

-- ── Payouts ───────────────────────────────────────────────────────────────────

CREATE TABLE payouts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID            NOT NULL
                                    REFERENCES bookings(id)
                                    ON DELETE RESTRICT,
    owner_id        UUID            NOT NULL
                                    REFERENCES users(id)
                                    ON DELETE RESTRICT,
    status          payout_status   NOT NULL    DEFAULT 'PENDING',
    -- Amounts
    gross_amount    NUMERIC(14, 2)  NOT NULL,
    tds_amount      NUMERIC(14, 2)  NOT NULL    DEFAULT 0,
    net_amount      NUMERIC(14, 2)  NOT NULL,
    -- RazorpayX reference
    fund_account_id VARCHAR(100)    NOT NULL,
    rp_payout_id    VARCHAR(100),               -- pout_xxxxx — null until initiated
    -- Scheduling
    scheduled_at    TIMESTAMPTZ     NOT NULL,   -- T+2 days from dispute window expiry
    executed_at     TIMESTAMPTZ,
    -- Failure tracking
    failure_reason  VARCHAR(255),
    retry_count     SMALLINT        NOT NULL    DEFAULT 0,
    last_retry_at   TIMESTAMPTZ,
    -- Timestamps
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Idempotency: one payout per booking
CREATE UNIQUE INDEX idx_payouts_booking
    ON payouts(booking_id);

-- PayoutEngine execution queue
CREATE INDEX idx_payouts_status_scheduled
    ON payouts(status, scheduled_at ASC)
    WHERE status IN ('PENDING', 'FAILED');

-- Webhook lookup by RazorpayX payout ID
CREATE INDEX idx_payouts_rp_payout_id
    ON payouts(rp_payout_id)
    WHERE rp_payout_id IS NOT NULL;

-- TDS / annual payout sum query
CREATE INDEX idx_payouts_owner_status_executed
    ON payouts(owner_id, status, executed_at)
    WHERE status = 'SUCCESS';

COMMENT ON TABLE payouts IS
    'Owner payout records. One per booking. Scheduled T+2 after dispute window expiry. '
    'Executed by PayoutEngine via RazorpayX.';

-- ── Escrow status on bookings ─────────────────────────────────────────────────

-- Add escrow columns to existing bookings table
-- (These may already exist if V7 added them — use IF NOT EXISTS guards)

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS escrow_status        escrow_status   NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS advance_amount        NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS remaining_amount      NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS security_deposit      NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS platform_fee          NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS gst_amount            NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS dispute_window_ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS handover_at           TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS returned_at           TIMESTAMPTZ;

-- Index for PayoutEngine dispute window scan
CREATE INDEX IF NOT EXISTS idx_bookings_dispute_window
    ON bookings(booking_status, dispute_window_ends_at)
    WHERE booking_status = 'RETURNED';

-- ── Trigger: auto-update updated_at ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payout_accounts_updated_at
    BEFORE UPDATE ON owner_payout_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payouts_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
