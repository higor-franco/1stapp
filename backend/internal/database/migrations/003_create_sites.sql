CREATE TABLE IF NOT EXISTS sites (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug                 TEXT        NOT NULL UNIQUE,
    business_name        TEXT        NOT NULL,
    business_description TEXT        NOT NULL,
    color_palette        TEXT        NOT NULL DEFAULT 'blue',
    html_content         TEXT        NOT NULL DEFAULT '',
    published            BOOLEAN     NOT NULL DEFAULT FALSE,
    custom_domain        TEXT,
    generation_count     INTEGER     NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sites_user_id_idx ON sites(user_id);
CREATE INDEX IF NOT EXISTS sites_slug_idx    ON sites(slug);
