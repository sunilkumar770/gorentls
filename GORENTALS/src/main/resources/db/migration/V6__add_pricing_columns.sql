-- V6__add_pricing_columns.sql
-- Adds GST and platform fee columns to bookings table.
-- Safe: ADD COLUMN only — no data loss. Flyway runs on next backend startup.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS gst_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Backfill gst_amount and platform_fee for UNPAID pending bookings only.
-- PAID bookings: we intentionally leave gst_amount=0 and platform_fee=0
-- because those charges were never applied (old system had no fees).
-- total_amount is NOT modified for any existing booking — the charge already happened.
UPDATE bookings
SET
  gst_amount   = ROUND(rental_amount * 0.18, 2),
  platform_fee = ROUND(rental_amount * 0.05, 2)
WHERE
  gst_amount = 0.00
  AND platform_fee = 0.00
  AND (payment_status = 'PENDING' OR payment_status IS NULL)
  AND razorpay_payment_id IS NULL;

-- Rollback (manual if needed):
-- ALTER TABLE bookings DROP COLUMN IF EXISTS gst_amount;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS platform_fee;
