CREATE TABLE IF NOT EXISTS onboarding_steps (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_name    TEXT        NOT NULL,
    completed    BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, step_name)
);

CREATE INDEX IF NOT EXISTS onboarding_user_id_idx ON onboarding_steps(user_id);
