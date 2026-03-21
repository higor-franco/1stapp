CREATE TABLE octadesk_configs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widget_code      TEXT         NOT NULL DEFAULT '',
    whatsapp_number  VARCHAR(20)  NOT NULL DEFAULT '',
    active           BOOLEAN      NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_octadesk_configs_user_id ON octadesk_configs(user_id);
