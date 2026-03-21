-- name: GetSubscriptionByUserID :one
SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1;

-- name: UpsertSubscription :one
INSERT INTO subscriptions (user_id, vindi_customer_id, vindi_subscription_id, status, current_period_end, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
ON CONFLICT (user_id) DO UPDATE SET
    vindi_customer_id     = EXCLUDED.vindi_customer_id,
    vindi_subscription_id = EXCLUDED.vindi_subscription_id,
    status                = EXCLUDED.status,
    current_period_end    = EXCLUDED.current_period_end,
    updated_at            = NOW()
RETURNING *;

-- name: UpdateSubscriptionStatus :one
UPDATE subscriptions SET status = $2, updated_at = NOW()
WHERE vindi_subscription_id = $1
RETURNING *;
