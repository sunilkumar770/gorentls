-- V16: Add favourites table (renter saved listings)
--
-- Constraints:
--   * user_id   → users.id       (UUID, CASCADE DELETE)
--   * listing_id→ listings.id    (UUID, CASCADE DELETE)
--   * UNIQUE(user_id, listing_id)  — one favourite per renter-listing pair
--   * Index on user_id for fast per-renter look-ups
CREATE TABLE favorites (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_favorites_renter_listing UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites (user_id);
