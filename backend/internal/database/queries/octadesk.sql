-- name: GetOctadeskByUserID :one
SELECT * FROM octadesk_configs WHERE user_id = $1 LIMIT 1;

-- name: UpsertOctadesk :one
INSERT INTO octadesk_configs (user_id, widget_code, whatsapp_number, active, updated_at)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (user_id) DO UPDATE SET
    widget_code     = EXCLUDED.widget_code,
    whatsapp_number = EXCLUDED.whatsapp_number,
    active          = EXCLUDED.active,
    updated_at      = NOW()
RETURNING *;
