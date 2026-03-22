CREATE TABLE seo_reports (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    run_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    results TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_seo_reports_user_id ON seo_reports(user_id);
