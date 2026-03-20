package handler

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
)

// ---- robots.txt ----

func (h *Handler) handleRobotsTxt(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, `User-agent: *
Allow: /
Allow: /site/

Sitemap: %s/sitemap.xml

# LLM crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Googlebot
Allow: /
`, h.cfg.BaseURL)
}

// ---- sitemap.xml ----

type sitemapURL struct {
	Loc        string `xml:"loc"`
	LastMod    string `xml:"lastmod"`
	ChangeFreq string `xml:"changefreq"`
	Priority   string `xml:"priority"`
}

type sitemapURLSet struct {
	XMLName xml.Name     `xml:"urlset"`
	XMLNS   string       `xml:"xmlns,attr"`
	URLs    []sitemapURL `xml:"url"`
}

func (h *Handler) handleSitemapXML(w http.ResponseWriter, r *http.Request) {
	sites, err := h.db.GetAllPublishedSites(r.Context())
	if err != nil {
		slog.Error("sitemap: get published sites", "err", err)
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}

	urlset := sitemapURLSet{
		XMLNS: "http://www.sitemaps.org/schemas/sitemap/0.9",
	}

	// Homepage
	urlset.URLs = append(urlset.URLs, sitemapURL{
		Loc:        h.cfg.BaseURL + "/",
		LastMod:    time.Now().Format("2006-01-02"),
		ChangeFreq: "weekly",
		Priority:   "1.0",
	})

	for _, s := range sites {
		lastMod := time.Now().Format("2006-01-02")
		if s.UpdatedAt.Valid {
			lastMod = s.UpdatedAt.Time.Format("2006-01-02")
		}
		urlset.URLs = append(urlset.URLs, sitemapURL{
			Loc:        fmt.Sprintf("%s/site/%s", h.cfg.BaseURL, s.Slug),
			LastMod:    lastMod,
			ChangeFreq: "weekly",
			Priority:   "0.8",
		})
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Write([]byte(xml.Header)) //nolint:errcheck
	if err := xml.NewEncoder(w).Encode(urlset); err != nil {
		slog.Error("sitemap: encode xml", "err", err)
	}
}

// ---- llms.txt ----

func (h *Handler) handleLlmsTxt(w http.ResponseWriter, r *http.Request) {
	sites, err := h.db.GetAllPublishedSites(r.Context())
	if err != nil {
		slog.Error("llms.txt: get published sites", "err", err)
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}

	var b strings.Builder
	b.WriteString("# Locaweb Start — Plataforma de Criação de Sites com IA\n\n")
	b.WriteString("## Sobre a plataforma\n\n")
	b.WriteString("Locaweb Start é uma plataforma brasileira de criação de sites profissionais com Inteligência Artificial.\n")
	b.WriteString("Usuários descrevem seus negócios e a IA gera um site completo em segundos.\n\n")
	b.WriteString("## Sites publicados nesta plataforma\n\n")

	for _, s := range sites {
		b.WriteString(fmt.Sprintf("### %s\n", s.BusinessName))
		b.WriteString(fmt.Sprintf("URL: %s/site/%s\n", h.cfg.BaseURL, s.Slug))
		b.WriteString(fmt.Sprintf("Descrição: %s\n\n", s.BusinessDescription))
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write([]byte(b.String())) //nolint:errcheck
}

// ---- JSON-LD injection ----

// injectJSONLD inserts a LocalBusiness JSON-LD block into the HTML <head>
// if one doesn't already exist. Returns the modified HTML.
func injectJSONLD(html string, site db.Site, baseURL string) string {
	// Skip if JSON-LD already present
	if strings.Contains(html, `"application/ld+json"`) {
		return html
	}

	siteURL := fmt.Sprintf("%s/site/%s", baseURL, site.Slug)

	ld := map[string]any{
		"@context":    "https://schema.org",
		"@type":       "LocalBusiness",
		"name":        site.BusinessName,
		"description": site.BusinessDescription,
		"url":         siteURL,
	}
	ldBytes, err := json.Marshal(ld)
	if err != nil {
		return html
	}

	script := fmt.Sprintf("\n<script type=\"application/ld+json\">\n%s\n</script>", string(ldBytes))

	// Also inject canonical link if missing
	canonical := fmt.Sprintf(`<link rel="canonical" href="%s" />`, siteURL)
	canonicalScript := canonical + script

	// Inject before </head>
	if idx := strings.Index(strings.ToLower(html), "</head>"); idx != -1 {
		return html[:idx] + canonicalScript + "\n" + html[idx:]
	}

	// Fallback: inject at the very beginning
	return canonicalScript + "\n" + html
}
