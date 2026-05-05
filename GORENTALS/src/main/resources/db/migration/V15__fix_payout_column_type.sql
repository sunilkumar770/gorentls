-- V15 Fix retry_count type to match Java INTEGER
ALTER TABLE payouts ALTER COLUMN retry_count TYPE INTEGER;
