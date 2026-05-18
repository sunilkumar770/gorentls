-- V22__add_auto_approve_bookings_to_user_settings.sql
-- Adds auto_approve_bookings option to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS auto_approve_bookings BOOLEAN DEFAULT FALSE;
