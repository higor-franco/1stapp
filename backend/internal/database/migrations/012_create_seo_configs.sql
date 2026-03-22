CREATE TABLE seo_configs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    keywords             TEXT[] NOT NULL DEFAULT '{}',
    competitor_domains   TEXT[] NOT NULL DEFAULT '{}',
    data_for_seo_login   TEXT NOT NULL DEFAULT '',
    data_for_seo_password TEXT NOT NULL DEFAULT '',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
