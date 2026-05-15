-- V20 Add condition column to listings table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'condition') THEN
        ALTER TABLE listings ADD COLUMN condition VARCHAR(50);
    END IF;
END $$;
