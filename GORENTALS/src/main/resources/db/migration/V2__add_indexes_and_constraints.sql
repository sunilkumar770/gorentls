-- V2: Performance indexes
-- Fills the version gap between V1 (baseline) and V3 (messaging schema).

CREATE INDEX IF NOT EXISTS idx_listings_city         ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_category     ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_is_available ON listings(is_available);
CREATE INDEX IF NOT EXISTS idx_listings_owner_id     ON listings(owner_id);

CREATE INDEX IF NOT EXISTS idx_bookings_renter_id    ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id   ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type       ON users(user_type);
