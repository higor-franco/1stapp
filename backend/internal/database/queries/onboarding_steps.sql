-- name: GetOnboardingStepsByUserID :many
SELECT * FROM onboarding_steps WHERE user_id = $1 ORDER BY created_at;

-- name: UpsertOnboardingStep :one
INSERT INTO onboarding_steps (user_id, step_name, completed, completed_at)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, step_name) DO UPDATE SET
    completed    = EXCLUDED.completed,
    completed_at = EXCLUDED.completed_at
RETURNING *;
