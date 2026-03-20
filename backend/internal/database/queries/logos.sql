-- name: GetLogoByUserID :one
SELECT * FROM logos WHERE user_id = $1;

-- name: UpsertLogo :one
INSERT INTO logos (user_id, svg_1, svg_2, svg_3, selected_index)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id) DO UPDATE
SET svg_1 = $2, svg_2 = $3, svg_3 = $4, selected_index = $5, updated_at = NOW()
RETURNING *;

-- name: UpdateLogoSelected :one
UPDATE logos
SET selected_index = $2, updated_at = NOW()
WHERE user_id = $1
RETURNING *;
