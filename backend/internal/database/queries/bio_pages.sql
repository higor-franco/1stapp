-- name: GetBioPageByUserID :one
SELECT * FROM bio_pages WHERE user_id = $1 LIMIT 1;

-- name: UpsertBioPage :one
INSERT INTO bio_pages (user_id, whatsapp, instagram, facebook, tiktok, youtube, extra_links, published, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
ON CONFLICT (user_id) DO UPDATE SET
    whatsapp    = EXCLUDED.whatsapp,
    instagram   = EXCLUDED.instagram,
    facebook    = EXCLUDED.facebook,
    tiktok      = EXCLUDED.tiktok,
    youtube     = EXCLUDED.youtube,
    extra_links = EXCLUDED.extra_links,
    published   = EXCLUDED.published,
    updated_at  = NOW()
RETURNING *;
