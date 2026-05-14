-- Migration: V17__listing_fields.sql
-- Add subcategory and condition columns to listings table
-- P2-1: Support enhanced listing categorization

ALTER TABLE listings
ADD COLUMN subcategory VARCHAR(100),
ADD COLUMN condition VARCHAR(50);

-- Create indexes for filtering/search performance
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings(subcategory);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);

COMMENT ON COLUMN listings.subcategory IS 'Sub-classification within category (e.g., "Laptops" under "Electronics")';
COMMENT ON COLUMN listings.condition IS 'Item condition: NEW, USED, REFURBISHED, etc.';
