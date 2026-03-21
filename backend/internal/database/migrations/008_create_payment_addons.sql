CREATE TABLE payment_addons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vindi_api_key   TEXT NOT NULL DEFAULT '',
    service_name    VARCHAR(255) NOT NULL DEFAULT '',
    service_amount  INTEGER NOT NULL DEFAULT 0,
    service_type    VARCHAR(50) NOT NULL DEFAULT 'one_time',
    active          BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_payment_addons_user_id ON payment_addons(user_id);
