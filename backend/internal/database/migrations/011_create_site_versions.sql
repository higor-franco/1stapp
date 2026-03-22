CREATE TABLE site_versions (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID    NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    version_num INTEGER NOT NULL,
    html_content TEXT   NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_versions_site_id ON site_versions(site_id);
