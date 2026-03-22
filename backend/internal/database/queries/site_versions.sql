-- name: CreateSiteVersion :one
INSERT INTO site_versions (site_id, version_num, html_content)
SELECT $1,
       COALESCE((SELECT MAX(version_num) FROM site_versions WHERE site_id = $1), 0) + 1,
       $2
RETURNING *;

-- name: GetSiteVersionsBySiteID :many
SELECT id, site_id, version_num, created_at
FROM site_versions
WHERE site_id = $1
ORDER BY version_num DESC
LIMIT 5;

-- name: GetSiteVersionHTML :one
SELECT html_content FROM site_versions WHERE id = $1 AND site_id = $2;

-- name: TrimSiteVersions :exec
DELETE FROM site_versions sv
WHERE sv.site_id = $1
  AND sv.id NOT IN (
      SELECT sv2.id FROM site_versions sv2
      WHERE sv2.site_id = $1
      ORDER BY sv2.version_num DESC
      LIMIT 5
  );
