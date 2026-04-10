CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE conversations (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id        UUID        NOT NULL REFERENCES listings(id)  ON DELETE CASCADE,
    booking_id        UUID                 REFERENCES bookings(id)  ON DELETE SET NULL,
    renter_id         UUID        NOT NULL REFERENCES users(id),
    owner_id          UUID        NOT NULL REFERENCES users(id),
    last_message      TEXT,
    last_message_at   TIMESTAMPTZ,
    renter_unread     INTEGER     NOT NULL DEFAULT 0,
    owner_unread      INTEGER     NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_listing_renter UNIQUE (listing_id, renter_id),
    CONSTRAINT chk_participants_differ CHECK (renter_id <> owner_id)
);

CREATE TABLE messages (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID        NOT NULL REFERENCES users(id),
    message_text     TEXT,
    message_type     VARCHAR(20) NOT NULL DEFAULT 'TEXT'
                     CHECK (message_type IN ('TEXT', 'IMAGE', 'SYSTEM')),
    status           VARCHAR(20) NOT NULL DEFAULT 'SENT'
                     CHECK (status IN ('SENT', 'DELIVERED', 'READ')),
    temp_id          UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_message_temp_id UNIQUE (conversation_id, temp_id)
);

CREATE INDEX idx_conversations_renter  ON conversations(renter_id);
CREATE INDEX idx_conversations_owner   ON conversations(owner_id);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created      ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender       ON messages(sender_id);

CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_conversations_updated_at();
