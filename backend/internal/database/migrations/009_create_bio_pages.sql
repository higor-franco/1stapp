CREATE TABLE bio_pages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    whatsapp    VARCHAR(20)  NOT NULL DEFAULT '',
    instagram   VARCHAR(100) NOT NULL DEFAULT '',
    facebook    VARCHAR(100) NOT NULL DEFAULT '',
    tiktok      VARCHAR(100) NOT NULL DEFAULT '',
    youtube     VARCHAR(100) NOT NULL DEFAULT '',
    extra_links TEXT         NOT NULL DEFAULT '[]',
    published   BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_bio_pages_user_id ON bio_pages(user_id);
