-- V13: Rename messages table to chat_messages to match JPA entity
-- This aligns the physical schema with the ChatMessage.java @Table annotation.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') AND
       NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN

        -- Rename the table
        ALTER TABLE messages RENAME TO chat_messages;

        -- Rename indexes for consistency (optional but recommended)
        ALTER INDEX IF EXISTS idx_messages_conversation RENAME TO idx_chat_messages_conversation;
        ALTER INDEX IF EXISTS idx_messages_created RENAME TO idx_chat_messages_created;
        ALTER INDEX IF EXISTS idx_messages_sender RENAME TO idx_chat_messages_sender;

    END IF;
END $$;
