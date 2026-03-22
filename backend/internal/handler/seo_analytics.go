package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type seoKeywordResult struct {
	Keyword    string `json:"keyword"`
	GoogleRank int    `json:"google_rank"` // 0 = not found / no API key
	LLMMention bool   `json:"llm_mention"`
	LLMSnippet string `json:"llm_snippet"`
	RankError  string `json:"rank_error,omitempty"`
}

// GET /api/seo/config
func (h *Handler) handleGetSEOConfig(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	cfg, err := h.db.GetSEOConfigByUserID(r.Context(), user.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusOK, map[string]any{
			"keywords":              []string{},
			"competitor_domains":    []string{},
			"data_for_seo_login":    "",
			"data_for_seo_password": "",
		})
		return
	}
	if err != nil {
		slog.Error("GetSEOConfigByUserID", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"keywords":              cfg.Keywords,
		"competitor_domains":    cfg.CompetitorDomains,
		"data_for_seo_login":    cfg.DataForSeoLogin,
		"data_for_seo_password": cfg.DataForSeoPassword,
	})
}

// POST /api/seo/config
func (h *Handler) handleSaveSEOConfig(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	if user.Plan != "start" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "recurso disponível no Plano Start"})
		return
	}
	var req struct {
		Keywords           []string `json:"keywords"`
		CompetitorDomains  []string `json:"competitor_domains"`
		DataForSEOLogin    string   `json:"data_for_seo_login"`
		DataForSEOPassword string   `json:"data_for_seo_password"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload inválido"})
		return
	}
	req.Keywords = filterStrings(req.Keywords)
	req.CompetitorDomains = filterStrings(req.CompetitorDomains)
	if len(req.Keywords) > 10 {
		req.Keywords = req.Keywords[:10]
	}
	if len(req.CompetitorDomains) > 5 {
		req.CompetitorDomains = req.CompetitorDomains[:5]
	}

	cfg, err := h.db.UpsertSEOConfig(r.Context(), db.UpsertSEOConfigParams{
		UserID:             user.ID,
		Keywords:           req.Keywords,
		CompetitorDomains:  req.CompetitorDomains,
		DataForSeoLogin:    req.DataForSEOLogin,
		DataForSeoPassword: req.DataForSEOPassword,
	})
	if err != nil {
		slog.Error("UpsertSEOConfig", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"keywords":              cfg.Keywords,
		"competitor_domains":    cfg.CompetitorDomains,
		"data_for_seo_login":    cfg.DataForSeoLogin,
		"data_for_seo_password": cfg.DataForSeoPassword,
	})
}

// POST /api/seo/analyze
func (h *Handler) handleRunSEOAnalysis(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	if user.Plan != "start" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "recurso disponível no Plano Start"})
		return
	}

	cfg, err := h.db.GetSEOConfigByUserID(r.Context(), user.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "configure palavras-chave antes de analisar"})
		return
	}
	if err != nil {
		slog.Error("GetSEOConfigByUserID analyze", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	if len(cfg.Keywords) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "adicione pelo menos uma palavra-chave"})
		return
	}

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "crie seu site antes de analisar"})
		return
	}
	if err != nil {
		slog.Error("GetSiteByUserID seo", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	gemini := newGeminiClient(h.cfg.GeminiAPIKey)

	var dfsClient *dataForSEOClient
	if cfg.DataForSeoLogin != "" && cfg.DataForSeoPassword != "" {
		dfsClient = newDataForSEOClient(cfg.DataForSeoLogin, cfg.DataForSeoPassword)
	}

	siteDomain := h.cfg.BaseURL
	if site.CustomDomain.Valid && site.CustomDomain.String != "" {
		siteDomain = site.CustomDomain.String
	}
	siteDomain = strings.TrimPrefix(siteDomain, "https://")
	siteDomain = strings.TrimPrefix(siteDomain, "http://")
	siteDomain = strings.Split(siteDomain, "/")[0]

	results := make([]seoKeywordResult, 0, len(cfg.Keywords))
	for _, kw := range cfg.Keywords {
		item := seoKeywordResult{Keyword: kw}

		if dfsClient != nil {
			rank, rankErr := dfsClient.getRank(r.Context(), kw, siteDomain)
			if rankErr != nil {
				item.RankError = rankErr.Error()
			} else {
				item.GoogleRank = rank
			}
		}

		mentioned, snippet, llmErr := gemini.checkLLMPresence(r.Context(), site.BusinessName, kw)
		if llmErr != nil {
			slog.Warn("checkLLMPresence", "keyword", kw, "err", llmErr)
		} else {
			item.LLMMention = mentioned
			item.LLMSnippet = snippet
		}

		results = append(results, item)
	}

	resultsJSON, _ := json.Marshal(results)
	report, err := h.db.CreateSEOReport(r.Context(), db.CreateSEOReportParams{
		UserID:  pgtype.UUID{Bytes: user.ID.Bytes, Valid: true},
		Results: string(resultsJSON),
	})
	if err != nil {
		slog.Error("CreateSEOReport", "err", err)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"report_id": report.ID,
		"run_at":    report.RunAt,
		"results":   results,
	})
}

// GET /api/seo/reports
func (h *Handler) handleGetSEOReports(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	reports, err := h.db.GetSEOReportsByUserID(r.Context(), user.ID)
	if err != nil {
		slog.Error("GetSEOReportsByUserID", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	type reportDTO struct {
		ID      pgtype.UUID     `json:"id"`
		RunAt   any             `json:"run_at"`
		Results json.RawMessage `json:"results"`
	}
	out := make([]reportDTO, 0, len(reports))
	for _, rep := range reports {
		out = append(out, reportDTO{
			ID:      rep.ID,
			RunAt:   rep.RunAt,
			Results: json.RawMessage(rep.Results),
		})
	}
	writeJSON(w, http.StatusOK, out)
}

func filterStrings(ss []string) []string {
	result := make([]string, 0, len(ss))
	for _, s := range ss {
		s = strings.TrimSpace(s)
		if s != "" {
			result = append(result, s)
		}
	}
	return result
}
