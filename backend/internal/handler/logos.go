package handler

import (
	"errors"
	"log/slog"
	"net/http"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
)

// ---- response types ----

type logoResponse struct {
	ID            string   `json:"id"`
	SVGs          []string `json:"svgs"`
	SelectedIndex int32    `json:"selected_index"`
}

func toLogoResponse(l db.Logo) logoResponse {
	return logoResponse{
		ID:            uuidToString(l.ID),
		SVGs:          []string{l.Svg1, l.Svg2, l.Svg3},
		SelectedIndex: l.SelectedIndex,
	}
}

// ---- handlers ----

// GET /api/logos/me — retorna as logos do usuário (ou null)
func (h *Handler) handleGetMyLogo(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	logo, err := h.db.GetLogoByUserID(r.Context(), user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusOK, map[string]any{"logo": nil})
			return
		}
		slog.Error("get logo error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao buscar logo"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"logo": toLogoResponse(logo)})
}

// POST /api/logos/generate — gera 3 opções de logo via Claude
func (h *Handler) handleGenerateLogo(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	// Require Plano Start
	if user.Plan != "start" {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{
			"error": "geração de logo disponível apenas no Plano Start.",
		})
		return
	}

	// Check Claude API key
	if h.cfg.ClaudeAPIKey == "" || h.cfg.ClaudeAPIKey == "your_claude_api_key_here" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "CLAUDE_API_KEY não configurado. Configure a chave no arquivo .env",
		})
		return
	}

	// Get business info from user's site (or from request body as fallback)
	var req struct {
		BusinessName        string `json:"business_name"`
		BusinessDescription string `json:"business_description"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}

	if req.BusinessName == "" || req.BusinessDescription == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "nome e descrição do negócio são obrigatórios",
		})
		return
	}

	// Call Claude API
	claude := newAnthropicClient(h.cfg.ClaudeAPIKey)
	logos, err := claude.generateLogos(r.Context(), req.BusinessName, req.BusinessDescription)
	if err != nil {
		slog.Error("claude generate logos error", "err", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "erro ao gerar logos com IA. Tente novamente."})
		return
	}

	// Save to DB (upsert)
	logo, err := h.db.UpsertLogo(r.Context(), db.UpsertLogoParams{
		UserID:        user.ID,
		Svg1:          logos.SVG1,
		Svg2:          logos.SVG2,
		Svg3:          logos.SVG3,
		SelectedIndex: 0,
	})
	if err != nil {
		slog.Error("upsert logo error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar logos"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"logo": toLogoResponse(logo)})
}

// PUT /api/logos/select — atualiza a logo selecionada
func (h *Handler) handleSelectLogo(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	var req struct {
		SelectedIndex int32 `json:"selected_index"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}
	if req.SelectedIndex < 0 || req.SelectedIndex > 2 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "índice inválido (0, 1 ou 2)"})
		return
	}

	logo, err := h.db.UpdateLogoSelected(r.Context(), db.UpdateLogoSelectedParams{
		UserID:        user.ID,
		SelectedIndex: req.SelectedIndex,
	})
	if err != nil {
		slog.Error("update logo selected error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao atualizar seleção"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"logo": toLogoResponse(logo)})
}
