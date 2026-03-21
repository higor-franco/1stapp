-- name: GetPaymentAddonByUserID :one
SELECT * FROM payment_addons WHERE user_id = $1 LIMIT 1;

-- name: UpsertPaymentAddon :one
INSERT INTO payment_addons (user_id, vindi_api_key, service_name, service_amount, service_type, active, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (user_id) DO UPDATE SET
    vindi_api_key  = EXCLUDED.vindi_api_key,
    service_name   = EXCLUDED.service_name,
    service_amount = EXCLUDED.service_amount,
    service_type   = EXCLUDED.service_type,
    active         = EXCLUDED.active,
    updated_at     = NOW()
RETURNING *;
