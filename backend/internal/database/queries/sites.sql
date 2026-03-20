-- name: CreateSite :one
INSERT INTO sites (user_id, slug, business_name, business_description, color_palette)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSiteByUserID :one
SELECT * FROM sites WHERE user_id = $1;

-- name: GetSiteBySlug :one
SELECT * FROM sites WHERE slug = $1;

-- name: UpdateSiteContent :one
UPDATE sites
SET html_content      = $2,
    published         = $3,
    generation_count  = generation_count + 1,
    updated_at        = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateSiteCustomDomain :one
UPDATE sites SET custom_domain = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;
