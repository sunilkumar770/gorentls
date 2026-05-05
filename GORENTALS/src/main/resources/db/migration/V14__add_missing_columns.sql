-- V14 Add missing columns to payouts table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'retry_count') THEN
        ALTER TABLE payouts ADD COLUMN retry_count SMALLINT NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payouts' AND column_name = 'last_retry_at') THEN
        ALTER TABLE payouts ADD COLUMN last_retry_at TIMESTAMPTZ;
    END IF;
END $$;
