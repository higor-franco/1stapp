CREATE TABLE invoices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vindi_bill_id INTEGER,
    amount        INTEGER NOT NULL DEFAULT 0,
    status        VARCHAR(50) NOT NULL DEFAULT 'pending',
    due_at        TIMESTAMPTZ,
    paid_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
