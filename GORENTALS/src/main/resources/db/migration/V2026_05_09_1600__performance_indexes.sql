-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_listing_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listing_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listing_owner_id ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listing_published_available ON listings(is_published, is_available);

CREATE INDEX IF NOT EXISTS idx_booking_renter_id ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_booking_start_date ON bookings(start_date);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON users(phone);

CREATE INDEX IF NOT EXISTS idx_conversation_participants ON conversations(owner_id, renter_id);
