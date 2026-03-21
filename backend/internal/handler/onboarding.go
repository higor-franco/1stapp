package handler

import (
	"errors"
	"net/http"
	"time"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var stepOrder = []string{"site", "logo", "bio", "whatsapp", "pagamentos", "dominio", "seo"}

type stepInfo struct {
	Name      string  `json:"name"`
	Completed bool    `json:"completed"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type onboardingResp struct {
	Steps       []stepInfo `json:"steps"`
	AllComplete bool       `json:"all_complete"`
}

// ── GET /api/onboarding ───────────────────────────────────────────────────────

func (h *Handler) handleGetOnboarding(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	// Compute actual completion from data
	computed := h.computeSteps(r, user)

	// Persist computed state
	for name, done := range computed {
		var completedAt pgtype.Timestamptz
		if done {
			completedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
		}
		_, _ = h.db.UpsertOnboardingStep(r.Context(), db.UpsertOnboardingStepParams{
			UserID:      user.ID,
			StepName:    name,
			Completed:   done,
			CompletedAt: completedAt,
		})
	}

	// Build ordered response
	steps := make([]stepInfo, 0, len(stepOrder))
	allComplete := true
	for _, name := range stepOrder {
		done := computed[name]
		if !done {
			allComplete = false
		}
		var completedAt *time.Time
		if done {
			t := time.Now()
			completedAt = &t
		}
		steps = append(steps, stepInfo{
			Name:        name,
			Completed:   done,
			CompletedAt: completedAt,
		})
	}

	writeJSON(w, http.StatusOK, onboardingResp{Steps: steps, AllComplete: allComplete})
}

// ── POST /api/onboarding/{step}/skip ─────────────────────────────────────────

func (h *Handler) handleSkipStep(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	step := r.PathValue("step")

	valid := false
	for _, s := range stepOrder {
		if s == step {
			valid = true
			break
		}
	}
	if !valid {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "etapa inválida"})
		return
	}

	_, err := h.db.UpsertOnboardingStep(r.Context(), db.UpsertOnboardingStepParams{
		UserID:      user.ID,
		StepName:    step,
		Completed:   true,
		CompletedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "skipped"})
}

// ── computeSteps — derives completion from actual data ───────────────────────

func (h *Handler) computeSteps(r *http.Request, user db.User) map[string]bool {
	result := make(map[string]bool, len(stepOrder))
	for _, s := range stepOrder {
		result[s] = false
	}

	// site
	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err == nil && site.HtmlContent != "" {
		result["site"] = true

		// dominio
		if site.CustomDomain.Valid && site.CustomDomain.String != "" {
			result["dominio"] = true
		}

		// seo — auto-complete when site is published
		if site.Published {
			result["seo"] = true
		}
	}

	// logo
	_, err = h.db.GetLogoByUserID(r.Context(), user.ID)
	if err == nil {
		result["logo"] = true
	}

	// bio
	bio, err := h.db.GetBioPageByUserID(r.Context(), user.ID)
	if err == nil && bio.Published {
		result["bio"] = true
	}

	// whatsapp (octadesk)
	octa, err := h.db.GetOctadeskByUserID(r.Context(), user.ID)
	if err == nil && octa.Active {
		result["whatsapp"] = true
	}

	// pagamentos
	addon, err := h.db.GetPaymentAddonByUserID(r.Context(), user.ID)
	if err == nil && addon.Active {
		result["pagamentos"] = true
	}

	return result
}

// ── GET /api/onboarding/banner — lightweight status for dashboard ─────────────

func (h *Handler) handleOnboardingBanner(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusOK, map[string]any{"show": false})
		return
	}

	// Check if banner was explicitly dismissed
	rows, _ := h.db.GetOnboardingStepsByUserID(r.Context(), user.ID)
	for _, row := range rows {
		if row.StepName == "_dismissed" && row.Completed {
			writeJSON(w, http.StatusOK, map[string]any{"show": false})
			return
		}
	}

	computed := h.computeSteps(r, user)
	pending := 0
	for _, done := range computed {
		if !done {
			pending++
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"show":    pending > 0,
		"pending": pending,
		"total":   len(stepOrder),
	})
}

// ── POST /api/onboarding/dismiss — dismiss the dashboard banner ───────────────

func (h *Handler) handleDismissBanner(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	_, err := h.db.UpsertOnboardingStep(r.Context(), db.UpsertOnboardingStepParams{
		UserID:      user.ID,
		StepName:    "_dismissed",
		Completed:   true,
		CompletedAt: pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "dismissed"})
}
