package handler

import (
	"errors"
	"net/http"
	"strings"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
)

// ── Get Octadesk (GET /api/octadesk) ─────────────────────────────────────────

func (h *Handler) handleGetOctadesk(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	cfg, err := h.db.GetOctadeskByUserID(r.Context(), user.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	writeJSON(w, http.StatusOK, cfg)
}

// ── Save Octadesk (POST /api/octadesk) ────────────────────────────────────────

type octadeskReq struct {
	WidgetCode     string `json:"widget_code"`
	WhatsappNumber string `json:"whatsapp_number"`
	Active         bool   `json:"active"`
}

func (h *Handler) handleSaveOctadesk(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{"error": "requer Plano Start"})
		return
	}

	var req octadeskReq
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "dados inválidos"})
		return
	}

	if req.Active && req.WidgetCode == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "cole o código do widget Octadesk para ativar"})
		return
	}

	cfg, err := h.db.UpsertOctadesk(r.Context(), db.UpsertOctadeskParams{
		UserID:         user.ID,
		WidgetCode:     req.WidgetCode,
		WhatsappNumber: req.WhatsappNumber,
		Active:         req.Active,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar"})
		return
	}

	// Inject or remove widget in site HTML
	if err := h.updateSiteOctadeskWidget(r, user, cfg); err != nil {
		// non-fatal
		_ = err
	}

	writeJSON(w, http.StatusOK, cfg)
}

const octaStart = "<!-- octadesk-widget -->"
const octaEnd = "<!-- /octadesk-widget -->"

func (h *Handler) updateSiteOctadeskWidget(r *http.Request, user db.User, cfg db.OctadeskConfig) error {
	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		return err
	}

	html := site.HtmlContent

	// Remove existing widget
	if start := strings.Index(html, octaStart); start != -1 {
		end := strings.Index(html[start:], octaEnd)
		if end != -1 {
			html = html[:start] + html[start+end+len(octaEnd):]
		}
	}

	if cfg.Active && cfg.WidgetCode != "" {
		injected := octaStart + cfg.WidgetCode + octaEnd
		html = strings.Replace(html, "</body>", injected+"</body>", 1)
	}

	_, err = h.db.UpdateSiteContent(r.Context(), db.UpdateSiteContentParams{
		ID:          site.ID,
		HtmlContent: html,
		Published:   site.Published,
	})
	return err
}
