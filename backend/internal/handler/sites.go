package handler

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"unicode"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ---- request / response types ----

type generateSiteRequest struct {
	BusinessName        string `json:"business_name"`
	BusinessDescription string `json:"business_description"`
	ColorPalette        string `json:"color_palette"`
}

type siteResponse struct {
	ID                  string `json:"id"`
	Slug                string `json:"slug"`
	BusinessName        string `json:"business_name"`
	BusinessDescription string `json:"business_description"`
	ColorPalette        string `json:"color_palette"`
	HtmlContent         string `json:"html_content"`
	Published           bool   `json:"published"`
	GenerationCount     int32  `json:"generation_count"`
	URL                 string `json:"url"`
}

func toSiteResponse(s db.Site) siteResponse {
	return siteResponse{
		ID:                  uuidToString(s.ID),
		Slug:                s.Slug,
		BusinessName:        s.BusinessName,
		BusinessDescription: s.BusinessDescription,
		ColorPalette:        s.ColorPalette,
		HtmlContent:         s.HtmlContent,
		Published:           s.Published,
		GenerationCount:     s.GenerationCount,
		URL:                 "/site/" + s.Slug,
	}
}

// ---- handlers ----

// GET /api/sites/me — retorna o site do usuário logado (ou null)
func (h *Handler) handleGetMySite(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusOK, map[string]any{"site": nil})
			return
		}
		slog.Error("get site error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao buscar site"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"site": toSiteResponse(site)})
}

// POST /api/sites/generate — cria ou regenera o site via Gemini
func (h *Handler) handleGenerateSite(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	var req generateSiteRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}

	req.BusinessName = strings.TrimSpace(req.BusinessName)
	req.BusinessDescription = strings.TrimSpace(req.BusinessDescription)
	if req.ColorPalette == "" {
		req.ColorPalette = "azul"
	}

	if req.BusinessName == "" || req.BusinessDescription == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "nome e descrição do negócio são obrigatórios"})
		return
	}

	// Check generation limit for free plan
	existingSite, siteErr := h.db.GetSiteByUserID(r.Context(), user.ID)
	if siteErr == nil && user.Plan == "free" && existingSite.GenerationCount >= 3 {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{
			"error": "limite de gerações atingido no plano Free. Faça upgrade para o Plano Start para gerações ilimitadas.",
		})
		return
	}

	// Check Gemini API key
	if h.cfg.GeminiAPIKey == "" || h.cfg.GeminiAPIKey == "your_gemini_api_key_here" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "GEMINI_API_KEY não configurado. Configure a chave no arquivo .env",
		})
		return
	}

	// Call Gemini API
	gemini := newGeminiClient(h.cfg.GeminiAPIKey)
	htmlContent, err := gemini.generateSite(r.Context(), req.BusinessName, req.BusinessDescription, req.ColorPalette)
	if err != nil {
		slog.Error("gemini generate error", "err", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "erro ao gerar site com IA. Tente novamente."})
		return
	}

	var site db.Site

	if errors.Is(siteErr, pgx.ErrNoRows) {
		// Create new site
		slug, err := h.uniqueSlug(r.Context(), req.BusinessName)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao criar slug"})
			return
		}
		site, err = h.db.CreateSite(r.Context(), db.CreateSiteParams{
			UserID:              user.ID,
			Slug:                slug,
			BusinessName:        req.BusinessName,
			BusinessDescription: req.BusinessDescription,
			ColorPalette:        req.ColorPalette,
		})
		if err != nil {
			slog.Error("create site error", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao criar site"})
			return
		}
		// Set HTML content
		site, err = h.db.UpdateSiteContent(r.Context(), db.UpdateSiteContentParams{
			ID:          site.ID,
			HtmlContent: htmlContent,
			Published:   false,
		})
		if err != nil {
			slog.Error("update site content error", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar site"})
			return
		}
	} else {
		// Save version before regenerating
		h.saveVersion(r.Context(), existingSite)
		// Update existing site
		site, err = h.db.UpdateSiteGeneration(r.Context(), db.UpdateSiteGenerationParams{
			UserID:              user.ID,
			BusinessName:        req.BusinessName,
			BusinessDescription: req.BusinessDescription,
			ColorPalette:        req.ColorPalette,
			HtmlContent:         htmlContent,
		})
		if err != nil {
			slog.Error("update site generation error", "err", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao atualizar site"})
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"site": toSiteResponse(site)})
}

// PUT /api/sites/{id}/publish — publica ou despublica o site
func (h *Handler) handlePublishSite(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	// Verify site belongs to user
	existing, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "site não encontrado"})
		return
	}

	var req struct {
		Published bool `json:"published"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}

	if existing.HtmlContent == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "gere o site antes de publicá-lo"})
		return
	}

	site, err := h.db.UpdateSitePublished(r.Context(), db.UpdateSitePublishedParams{
		ID:        existing.ID,
		Published: req.Published,
	})
	if err != nil {
		slog.Error("publish site error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao publicar site"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"site": toSiteResponse(site)})
}

// GET /site/{slug} — serve o HTML do site publicado (rota pública)
func (h *Handler) handleServeSite(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	site, err := h.db.GetSiteBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}

	if !site.Published {
		http.Error(w, "Site não publicado", http.StatusNotFound)
		return
	}

	html := injectJSONLD(site.HtmlContent, site, h.cfg.BaseURL)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(html)) //nolint:errcheck
}

// GET /site/{slug}/preview — serve o HTML para preview (sem exigir published)
func (h *Handler) handlePreviewSite(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if site.HtmlContent == "" {
		http.Error(w, "Site ainda não gerado", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(site.HtmlContent)) //nolint:errcheck
}

// ---- helpers ----

func (h *Handler) uniqueSlug(ctx context.Context, name string) (string, error) {
	base := slugify(name)
	if base == "" {
		base = "meu-site"
	}
	slug := base
	for i := 1; i <= 10; i++ {
		exists, err := h.db.SlugExists(ctx, slug)
		if err != nil {
			return "", fmt.Errorf("check slug: %w", err)
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%d", base, i)
	}
	return "", fmt.Errorf("não foi possível gerar slug único")
}

var nonAlnum = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	// normalize: lowercase, remove accents (simple approach)
	s = strings.ToLower(s)
	s = removeAccents(s)
	s = nonAlnum.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 50 {
		s = s[:50]
	}
	return s
}

func removeAccents(s string) string {
	replacer := strings.NewReplacer(
		"á", "a", "à", "a", "ã", "a", "â", "a", "ä", "a",
		"é", "e", "è", "e", "ê", "e", "ë", "e",
		"í", "i", "ì", "i", "î", "i", "ï", "i",
		"ó", "o", "ò", "o", "õ", "o", "ô", "o", "ö", "o",
		"ú", "u", "ù", "u", "û", "u", "ü", "u",
		"ç", "c", "ñ", "n",
	)
	result := replacer.Replace(s)
	var b strings.Builder
	for _, r := range result {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' || r == '-' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// pgtype.UUID helper for site ID from path
func parsePgtypeUUID(s string) (pgtype.UUID, error) {
	s = strings.ReplaceAll(s, "-", "")
	if len(s) != 32 {
		return pgtype.UUID{}, fmt.Errorf("invalid uuid")
	}
	var b [16]byte
	for i := 0; i < 16; i++ {
		hi := hexVal(s[i*2])
		lo := hexVal(s[i*2+1])
		if hi > 15 || lo > 15 {
			return pgtype.UUID{}, fmt.Errorf("invalid uuid char")
		}
		b[i] = hi<<4 | lo
	}
	return pgtype.UUID{Bytes: b, Valid: true}, nil
}

func hexVal(c byte) byte {
	switch {
	case c >= '0' && c <= '9':
		return c - '0'
	case c >= 'a' && c <= 'f':
		return c - 'a' + 10
	case c >= 'A' && c <= 'F':
		return c - 'A' + 10
	default:
		return 255
	}
}

// ── saveVersion saves the current HTML as a version snapshot ─────────────────

func (h *Handler) saveVersion(ctx context.Context, site db.Site) {
	if site.HtmlContent == "" {
		return
	}
	_, err := h.db.CreateSiteVersion(ctx, db.CreateSiteVersionParams{
		SiteID:      site.ID,
		HtmlContent: site.HtmlContent,
	})
	if err != nil {
		slog.Warn("save version failed", "err", err)
		return
	}
	_ = h.db.TrimSiteVersions(ctx, site.ID)
}

// ── POST /api/sites/edit — alter site via prompt ──────────────────────────────

type editSiteReq struct {
	Instruction string `json:"instruction"`
}

func (h *Handler) handleEditSite(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{"error": "requer Plano Start"})
		return
	}

	var req editSiteReq
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}
	req.Instruction = strings.TrimSpace(req.Instruction)
	if req.Instruction == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "instrução não pode ser vazia"})
		return
	}

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "site não encontrado"})
		return
	}

	if h.cfg.GeminiAPIKey == "" {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "GEMINI_API_KEY não configurado"})
		return
	}

	// Save version before editing
	h.saveVersion(r.Context(), site)

	gemini := newGeminiClient(h.cfg.GeminiAPIKey)
	newHTML, err := gemini.editSite(r.Context(), site.HtmlContent, req.Instruction)
	if err != nil {
		slog.Error("gemini edit error", "err", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "erro ao editar site com IA. Tente novamente."})
		return
	}

	updated, err := h.db.UpdateSiteContent(r.Context(), db.UpdateSiteContentParams{
		ID:          site.ID,
		HtmlContent: newHTML,
		Published:   site.Published,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"site": toSiteResponse(updated)})
}

// ── GET /api/sites/versions — list last 5 versions ───────────────────────────

type versionItem struct {
	ID         string `json:"id"`
	VersionNum int32  `json:"version_num"`
	CreatedAt  string `json:"created_at"`
}

func (h *Handler) handleGetSiteVersions(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusOK, []versionItem{})
		return
	}

	rows, err := h.db.GetSiteVersionsBySiteID(r.Context(), site.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	items := make([]versionItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, versionItem{
			ID:         uuidToString(row.ID),
			VersionNum: row.VersionNum,
			CreatedAt:  row.CreatedAt.Time.Format("02/01/2006 15:04"),
		})
	}
	writeJSON(w, http.StatusOK, items)
}

// ── POST /api/sites/versions/{id}/restore ────────────────────────────────────

func (h *Handler) handleRestoreVersion(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	versionID, err := parsePgtypeUUID(strings.ReplaceAll(r.PathValue("id"), "-", ""))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"})
		return
	}

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "site não encontrado"})
		return
	}

	htmlContent, err := h.db.GetSiteVersionHTML(r.Context(), db.GetSiteVersionHTMLParams{
		ID:     versionID,
		SiteID: site.ID,
	})
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "versão não encontrada"})
		return
	}

	// Save current as version before restoring
	h.saveVersion(r.Context(), site)

	updated, err := h.db.UpdateSiteHTMLOnly(r.Context(), db.UpdateSiteHTMLOnlyParams{
		ID:          site.ID,
		HtmlContent: htmlContent,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao restaurar"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"site": toSiteResponse(updated)})
}
