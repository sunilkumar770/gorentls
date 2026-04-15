-- Admin user (admin@gorentals.com) is NOT seeded here. Insert manually via psql.
-- All seed users: password = Password@123

BEGIN;

-- Owners
INSERT INTO users (id, email, password_hash, full_name, user_type, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner1@test.com', '$2a$10$F91o7qidDXtXWzGI29hpkuMQdSDJg6uKETFF6h6X1V5swcm1wcK3C', 'Alice Owner', 'OWNER', true),
  ('22222222-2222-2222-2222-222222222222', 'owner2@test.com', '$2a$10$F91o7qidDXtXWzGI29hpkuMQdSDJg6uKETFF6h6X1V5swcm1wcK3C', 'Bob Owner', 'OWNER', true)
ON CONFLICT (email) DO NOTHING;

-- Renters
INSERT INTO users (id, email, password_hash, full_name, user_type, is_active)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'renter1@test.com', '$2a$10$F91o7qidDXtXWzGI29hpkuMQdSDJg6uKETFF6h6X1V5swcm1wcK3C', 'Charlie Renter', 'RENTER', true),
  ('44444444-4444-4444-4444-444444444444', 'renter2@test.com', '$2a$10$F91o7qidDXtXWzGI29hpkuMQdSDJg6uKETFF6h6X1V5swcm1wcK3C', 'David Renter', 'RENTER', true)
ON CONFLICT (email) DO NOTHING;

-- User Profiles
INSERT INTO user_profiles (id, user_id, kyc_status, city, state)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'APPROVED', 'Bangalore', 'Karnataka'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'PENDING', 'Mumbai', 'Maharashtra'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'APPROVED', 'Delhi', 'Delhi'),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'PENDING', 'Chennai', 'Tamil Nadu')
ON CONFLICT (user_id) DO NOTHING;

-- Listings
INSERT INTO listings (id, owner_id, title, description, category, type, price_per_day, security_deposit, city, is_published, is_available)
VALUES
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', 'Sony A7IV Camera', 'Professional full frame camera', 'Photography', 'Electronics', 1500, 5000, 'Bangalore', true, true),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '11111111-1111-1111-1111-111111111111', 'Mountain Bike', 'High-end trail bike', 'Sports & Fitness', 'Vehicles', 800, 2000, 'Bangalore', true, true),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '22222222-2222-2222-2222-222222222222', 'Camping Tent', '4-person waterproof tent', 'Outdoor', 'Other', 500, 1000, 'Mumbai', false, true);

-- Blocked Dates
INSERT INTO blocked_dates (id, listing_id, start_date, end_date, reason)
VALUES
  (gen_random_uuid(), 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 'MANUAL');

-- Bookings
INSERT INTO bookings (id, listing_id, renter_id, start_date, end_date, total_days, rental_amount, security_deposit, total_amount, status, payment_status)
VALUES
  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '33333333-3333-3333-3333-333333333333', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '12 days', 2, 3000, 5000, 8000, 'CONFIRMED', 'COMPLETED'),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '44444444-4444-4444-4444-444444444444', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 1, 800, 2000, 2800, 'PENDING', 'PENDING');

-- Also block dates for the confirmed booking
INSERT INTO blocked_dates (id, listing_id, booking_id, start_date, end_date, reason)
VALUES
  (gen_random_uuid(), 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '12 days', 'BOOKING')
ON CONFLICT (listing_id, booking_id) DO NOTHING;

-- Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'New Booking Request', 'You have a new booking request for Mountain Bike', 'BOOKING_UPDATE', false),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Booking Confirmed', 'Your booking for Sony A7IV Camera is confirmed', 'BOOKING_UPDATE', true);

-- Conversations
INSERT INTO conversations (id, listing_id, owner_id, renter_id)
VALUES
  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');

-- Messages
INSERT INTO chat_messages (id, conversation_id, sender_id, message_text, status)
VALUES
  (gen_random_uuid(), 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '33333333-3333-3333-3333-333333333333', 'Hi, is the camera available for next weekend?', 'SENT'),
  (gen_random_uuid(), 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '11111111-1111-1111-1111-111111111111', 'Yes, it is!', 'SENT');

COMMIT;
