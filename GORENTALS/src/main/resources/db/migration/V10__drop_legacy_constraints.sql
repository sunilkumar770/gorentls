-- V10: Remove legacy check constraints that block the new escrow state machine
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Ensure the columns have enough length for new enum values
ALTER TABLE bookings ALTER COLUMN status TYPE VARCHAR(32);
ALTER TABLE bookings ALTER COLUMN payment_status TYPE VARCHAR(32);
