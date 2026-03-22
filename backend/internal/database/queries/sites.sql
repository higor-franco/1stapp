-- name: CreateSite :one
INSERT INTO sites (user_id, slug, business_name, business_description, color_palette)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetSiteByUserID :one
SELECT * FROM sites WHERE user_id = $1;

-- name: GetSiteBySlug :one
SELECT * FROM sites WHERE slug = $1;

-- name: SlugExists :one
SELECT EXISTS(SELECT 1 FROM sites WHERE slug = $1) AS exists;

-- name: UpdateSiteGeneration :one
UPDATE sites
SET business_name        = $2,
    business_description = $3,
    color_palette        = $4,
    html_content         = $5,
    generation_count     = generation_count + 1,
    updated_at           = NOW()
WHERE user_id = $1
RETURNING *;

-- name: UpdateSitePublished :one
UPDATE sites SET published = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

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

-- name: UpdateSiteHTMLOnly :one
UPDATE sites SET html_content = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetSiteByCustomDomain :one
SELECT * FROM sites WHERE custom_domain = $1 AND published = true LIMIT 1;

-- name: GetAllPublishedSites :many
SELECT id, slug, business_name, business_description, updated_at
FROM sites
WHERE published = true
ORDER BY updated_at DESC;
