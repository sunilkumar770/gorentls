-- V6__add_pricing_columns.sql
-- Adds GST and platform fee columns to bookings table.
-- Safe: ADD COLUMN only — no data loss. Flyway runs on next backend startup.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS gst_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Backfill existing rows with computed Phase 1 values (audit / reporting consistency).
-- NOTE: these are DISPLAY values only — no real charge was applied to old bookings.
UPDATE bookings
SET
  gst_amount   = ROUND(rental_amount * 0.18, 2),
  platform_fee = ROUND(rental_amount * 0.05, 2),
  total_amount = ROUND(
    rental_amount
    + (rental_amount * 0.18)
    + (rental_amount * 0.05)
    + security_deposit,
    2
  )
WHERE gst_amount = 0.00 AND platform_fee = 0.00;

-- Rollback (manual if needed):
-- ALTER TABLE bookings DROP COLUMN IF EXISTS gst_amount;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS platform_fee;
