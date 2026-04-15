-- V5 — Blocked Dates for Listings
CREATE TABLE IF NOT EXISTS blocked_dates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    reason      VARCHAR(50) NOT NULL DEFAULT 'MANUAL', -- 'MANUAL' or 'BOOKING'
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_blocked_date_booking UNIQUE (listing_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_listing ON blocked_dates(listing_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_range   ON blocked_dates(start_date, end_date);
