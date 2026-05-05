-- V13 Rename messages to chat_messages to match JPA entity
DO $$ 
BEGIN 
    -- If both exist, chat_messages is likely an auto-generated ghost table from ddl-auto: update.
    -- We drop it and rename the proper migration-managed table.
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') AND EXISTS (SELECT FROM pg_tables WHERE tablename = 'chat_messages') THEN
        DROP TABLE chat_messages CASCADE;
        ALTER TABLE messages RENAME TO chat_messages;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
        ALTER TABLE messages RENAME TO chat_messages;
    END IF;

    -- Ensure the message_text column exists (Hibernate validation requirement)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='message_text') THEN
        ALTER TABLE chat_messages ADD COLUMN message_text TEXT;
    END IF;

    -- Consistent index names
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_conversation') THEN
        ALTER INDEX idx_messages_conversation RENAME TO idx_chat_messages_conversation;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_created') THEN
        ALTER INDEX idx_messages_created RENAME TO idx_chat_messages_created;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_sender') THEN
        ALTER INDEX idx_messages_sender RENAME TO idx_chat_messages_sender;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_message_temp_id') THEN
        ALTER INDEX uq_message_temp_id RENAME TO uq_chat_message_temp_id;
    END IF;
END $$;
