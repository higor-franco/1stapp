CREATE TABLE IF NOT EXISTS logos (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    svg_1            TEXT        NOT NULL DEFAULT '',
    svg_2            TEXT        NOT NULL DEFAULT '',
    svg_3            TEXT        NOT NULL DEFAULT '',
    selected_index   INT         NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS logos_user_id_idx ON logos(user_id);
