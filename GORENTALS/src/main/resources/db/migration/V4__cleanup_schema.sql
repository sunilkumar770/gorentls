-- V4 Cleanup orphan columns added by ddl-auto: update
ALTER TABLE conversations DROP COLUMN IF EXISTS participant1_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS participant2_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS unread_p1;
ALTER TABLE conversations DROP COLUMN IF EXISTS unread_p2;
