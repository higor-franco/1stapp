-- name: GetSEOConfigByUserID :one
SELECT * FROM seo_configs WHERE user_id = $1;

-- name: UpsertSEOConfig :one
INSERT INTO seo_configs (user_id, keywords, competitor_domains, data_for_seo_login, data_for_seo_password)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id) DO UPDATE
SET keywords              = EXCLUDED.keywords,
    competitor_domains    = EXCLUDED.competitor_domains,
    data_for_seo_login    = EXCLUDED.data_for_seo_login,
    data_for_seo_password = EXCLUDED.data_for_seo_password,
    updated_at            = NOW()
RETURNING *;

-- name: CreateSEOReport :one
INSERT INTO seo_reports (user_id, results)
VALUES ($1, $2)
RETURNING *;

-- name: GetSEOReportsByUserID :many
SELECT id, user_id, run_at, results
FROM seo_reports
WHERE user_id = $1
ORDER BY run_at DESC
LIMIT 10;
