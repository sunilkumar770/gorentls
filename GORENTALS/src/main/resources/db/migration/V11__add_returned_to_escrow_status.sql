-- V11: Add RETURNED status to escrow_status enum
-- This status represents the state after item return but before payout/dispute resolution.

ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'RETURNED';
