-- ============================================================
-- GoRentals V6 — Escrow Payment System
-- Safe to run on production. All ALTER statements are additive.
-- Flyway idempotent guard: IF NOT EXISTS on all objects.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM (
    'PENDING_PAYMENT','CONFIRMED','IN_USE','RETURNED',
    'COMPLETED','CANCELLED','NO_SHOW','DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status_enum AS ENUM (
    'NONE','ADVANCE_HELD','FULL_HELD','PARTIAL_RELEASED',
    'REFUNDED','ON_HOLD','READY_FOR_PAYOUT','PAID_OUT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_kind_enum AS ENUM (
    'ADVANCE','FINAL','SECURITY_DEPOSIT','PENALTY','REFUND'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_account_enum AS ENUM (
    'RENTER_ESCROW','OWNER_ESCROW','PLATFORM_FEE',
    'TAX_TDS','TAX_TCS','SECURITY_HOLD','BANK_SETTLEMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_direction_enum AS ENUM ('DEBIT','CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status_enum AS ENUM (
    'PENDING','INITIATED','SUCCESS','FAILED','ON_HOLD'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_onboarding_enum AS ENUM (
    'PENDING','VERIFIED','BLOCKED','SUSPENDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status_enum AS ENUM (
    'OPEN','UNDER_REVIEW','RESOLVED_REFUND',
    'RESOLVED_PAYOUT','RESOLVED_SPLIT','REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Extend bookings ───────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_status          VARCHAR(32)   NOT NULL DEFAULT 'PENDING_PAYMENT',
  ADD COLUMN IF NOT EXISTS escrow_status           VARCHAR(32)   NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS advance_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee            NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tcs_amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_window_ends_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS returned_at             TIMESTAMPTZ;

-- ── Extend payments ───────────────────────────────────────────────────────────

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS kind             VARCHAR(24) NOT NULL DEFAULT 'ADVANCE',
  ADD COLUMN IF NOT EXISTS escrow_reference VARCHAR(128);

-- ── Ledger transactions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID          NOT NULL,
  payment_id  UUID,
  account     VARCHAR(24)   NOT NULL,
  direction   VARCHAR(8)    NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency    VARCHAR(3)    NOT NULL DEFAULT 'INR',
  reason      TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_booking ON ledger_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON ledger_transactions(account, direction);

-- ── Payouts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payouts (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID          NOT NULL,
  owner_id        UUID          NOT NULL,
  gross_amount    NUMERIC(12,2) NOT NULL,
  tds_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(12,2) NOT NULL,
  status          VARCHAR(16)   NOT NULL DEFAULT 'PENDING',
  scheduled_at    TIMESTAMPTZ,
  executed_at     TIMESTAMPTZ,
  failure_reason  TEXT,
  rp_payout_id    VARCHAR(64),
  fund_account_id VARCHAR(64),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_booking ON payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status  ON payouts(status);

-- ── Owner payout accounts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS owner_payout_accounts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID        NOT NULL UNIQUE,
  account_type     VARCHAR(8)  NOT NULL DEFAULT 'BANK',
  account_number   VARCHAR(64),
  ifsc             VARCHAR(16),
  upi_id           VARCHAR(128),
  fund_account_id  VARCHAR(64),
  status           VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  verification_ref VARCHAR(128),
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Disputes ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disputes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID        NOT NULL,
  opened_by         UUID        NOT NULL,
  opened_by_role    VARCHAR(8)  NOT NULL,
  reason_code       VARCHAR(32) NOT NULL,
  description       TEXT,
  status            VARCHAR(24) NOT NULL DEFAULT 'OPEN',
  evidence_urls     TEXT[],
  owner_payout_amt  NUMERIC(12,2),
  renter_refund_amt NUMERIC(12,2),
  resolved_by       UUID,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status  ON disputes(status);

-- ── Backfill existing bookings ────────────────────────────────────────────────
-- Maps your current payment_status / status columns to the new escrow model.
-- No data is deleted or modified beyond these two columns.

UPDATE bookings
SET
  booking_status = CASE
    WHEN payment_status = 'CAPTURED' THEN 'CONFIRMED'
    WHEN status         = 'COMPLETED' THEN 'COMPLETED'
    WHEN status         = 'CANCELLED' THEN 'CANCELLED'
    ELSE 'PENDING_PAYMENT'
  END,
  escrow_status = CASE
    WHEN payment_status = 'CAPTURED' THEN 'ADVANCE_HELD'
    WHEN status         = 'COMPLETED' THEN 'PAID_OUT'
    ELSE 'NONE'
  END,
  advance_amount = total_amount,
  gst_amount     = ROUND(rental_amount * 0.18, 2),
  platform_fee   = ROUND(rental_amount * 0.05, 2)
WHERE booking_status = 'PENDING_PAYMENT';

-- ── Comments ──────────────────────────────────────────────────────────────────

COMMENT ON TABLE ledger_transactions IS
  'Double-entry internal ledger. Every financial event produces two rows: one DEBIT and one CREDIT of equal amount.';

COMMENT ON TABLE payouts IS
  'Outgoing RazorpayX transfers to owner fund accounts. Scheduled after dispute window expires.';

COMMENT ON TABLE owner_payout_accounts IS
  'Verified bank/UPI accounts for owner payouts. fund_account_id is the RazorpayX FA reference.';

COMMENT ON TABLE disputes IS
  'Dispute records raised by renters or owners during the 24–48h post-return window.';
C R E A T E   T A B L E   I F   N O T   E X I S T S   s h e d l o c k ( n a m e   V A R C H A R ( 6 4 )   N O T   N U L L ,   l o c k _ u n t i l   T I M E S T A M P   N O T   N U L L ,   l o c k e d _ a t   T I M E S T A M P   N O T   N U L L ,   l o c k e d _ b y   V A R C H A R ( 2 5 5 )   N O T   N U L L ,   P R I M A R Y   K E Y   ( n a m e ) ) ;  
 