package handler

import (
	"net"
	"net/http"
	"regexp"
	"strings"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

var domainRe = regexp.MustCompile(`^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$`)

// ── GET /api/domain/me ────────────────────────────────────────────────────────

func (h *Handler) handleGetDomain(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"custom_domain": nil})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"custom_domain": site.CustomDomain,
		"slug":          site.Slug,
	})
}

// ── POST /api/domain/configure ────────────────────────────────────────────────

type configureDomainReq struct {
	Domain string `json:"domain"`
}

func (h *Handler) handleConfigureDomain(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{"error": "requer Plano Start"})
		return
	}

	var req configureDomainReq
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "dados inválidos"})
		return
	}

	req.Domain = strings.ToLower(strings.TrimSpace(req.Domain))
	req.Domain = strings.TrimPrefix(req.Domain, "http://")
	req.Domain = strings.TrimPrefix(req.Domain, "https://")
	req.Domain = strings.TrimPrefix(req.Domain, "www.")
	req.Domain = strings.TrimRight(req.Domain, "/")

	if !domainRe.MatchString(req.Domain) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "domínio inválido"})
		return
	}

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "crie um site antes de configurar um domínio"})
		return
	}

	// Check if domain is already in use by another site
	existing, err := h.db.GetSiteByCustomDomain(r.Context(), pgtype.Text{String: req.Domain, Valid: true})
	if err == nil && existing.ID != site.ID {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "este domínio já está em uso"})
		return
	}

	updated, err := h.db.UpdateSiteCustomDomain(r.Context(), db.UpdateSiteCustomDomainParams{
		ID:           site.ID,
		CustomDomain: pgtype.Text{String: req.Domain, Valid: true},
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"custom_domain": updated.CustomDomain,
		"dns_instructions": dnsInstructions(h.cfg.BaseURL),
	})
}

// ── DELETE /api/domain/configure ─────────────────────────────────────────────

func (h *Handler) handleRemoveDomain(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "site não encontrado"})
		return
	}

	_, err = h.db.UpdateSiteCustomDomain(r.Context(), db.UpdateSiteCustomDomainParams{
		ID:           site.ID,
		CustomDomain: pgtype.Text{Valid: false},
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao remover domínio"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

// ── GET /api/domain/verify ────────────────────────────────────────────────────

func (h *Handler) handleVerifyDomain(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	site, err := h.db.GetSiteByUserID(r.Context(), user.ID)
	if err != nil || !site.CustomDomain.Valid || site.CustomDomain.String == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "nenhum domínio configurado"})
		return
	}

	domain := site.CustomDomain.String
	ips, err := net.LookupHost(domain)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"domain":    domain,
			"propagated": false,
			"ips":       []string{},
			"message":   "Domínio não resolvido. Verifique se as configurações de DNS foram salvas e aguarde a propagação (pode levar até 48h).",
		})
		return
	}

	serverIP := extractIP(h.cfg.BaseURL)
	propagated := false
	for _, ip := range ips {
		if ip == serverIP {
			propagated = true
			break
		}
	}

	msg := "DNS propagado com sucesso! Seu domínio está apontando para o servidor correto."
	if !propagated {
		msg = "Domínio resolvido, mas ainda não aponta para nosso servidor. Verifique as configurações de DNS e aguarde a propagação."
		if serverIP == "" {
			msg = "Domínio resolvido. Configure o registro A com o IP do servidor fornecido."
			propagated = true // treat as ok when we can't determine our own IP
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"domain":    domain,
		"propagated": propagated,
		"ips":       ips,
		"message":   msg,
	})
}

// ── Custom domain middleware ──────────────────────────────────────────────────

func (h *Handler) customDomainMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host := r.Host
		// Strip port
		if idx := strings.LastIndex(host, ":"); idx != -1 {
			host = host[:idx]
		}
		host = strings.ToLower(strings.TrimSpace(host))

		// Skip our own domains
		ownHost := extractHost(h.cfg.BaseURL)
		if host == "" || host == "localhost" || host == ownHost {
			next.ServeHTTP(w, r)
			return
		}

		// Look up site by custom domain
		site, err := h.db.GetSiteByCustomDomain(r.Context(), pgtype.Text{String: host, Valid: true})
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		// Serve the site HTML directly
		html := injectJSONLD(site.HtmlContent, site, h.cfg.BaseURL)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(html)) //nolint:errcheck
	})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func extractIP(baseURL string) string {
	baseURL = strings.TrimPrefix(baseURL, "http://")
	baseURL = strings.TrimPrefix(baseURL, "https://")
	host := strings.Split(baseURL, "/")[0]
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		host = host[:idx]
	}
	if net.ParseIP(host) != nil {
		return host
	}
	ips, err := net.LookupHost(host)
	if err != nil || len(ips) == 0 {
		return ""
	}
	return ips[0]
}

func extractHost(baseURL string) string {
	baseURL = strings.TrimPrefix(baseURL, "http://")
	baseURL = strings.TrimPrefix(baseURL, "https://")
	host := strings.Split(baseURL, "/")[0]
	if idx := strings.LastIndex(host, ":"); idx != -1 {
		host = host[:idx]
	}
	return strings.ToLower(host)
}

type dnsInstructionItem struct {
	Type  string `json:"type"`
	Host  string `json:"host"`
	Value string `json:"value"`
	TTL   string `json:"ttl"`
}

func dnsInstructions(baseURL string) []dnsInstructionItem {
	ip := extractIP(baseURL)
	cname := extractHost(baseURL)
	if ip == "" {
		ip = "IP_DO_SERVIDOR"
	}
	if cname == "" {
		cname = "locawebstart.com.br"
	}
	return []dnsInstructionItem{
		{Type: "A", Host: "@", Value: ip, TTL: "3600"},
		{Type: "A", Host: "www", Value: ip, TTL: "3600"},
		{Type: "CNAME", Host: "www", Value: cname + ".", TTL: "3600"},
	}
}
