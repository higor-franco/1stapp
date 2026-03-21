package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"strings"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
)

// ── Get Bio (GET /api/bio/me) ─────────────────────────────────────────────────

func (h *Handler) handleGetBio(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	bio, err := h.db.GetBioPageByUserID(r.Context(), user.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeJSON(w, http.StatusOK, nil)
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	writeJSON(w, http.StatusOK, bio)
}

// ── Save Bio (POST /api/bio) ──────────────────────────────────────────────────

type bioReq struct {
	Whatsapp   string      `json:"whatsapp"`
	Instagram  string      `json:"instagram"`
	Facebook   string      `json:"facebook"`
	Tiktok     string      `json:"tiktok"`
	Youtube    string      `json:"youtube"`
	ExtraLinks []extraLink `json:"extra_links"`
	Published  bool        `json:"published"`
}

type extraLink struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

func (h *Handler) handleSaveBio(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)

	if user.Plan != "start" {
		writeJSON(w, http.StatusPaymentRequired, map[string]string{"error": "requer Plano Start"})
		return
	}

	var req bioReq
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "dados inválidos"})
		return
	}

	if req.ExtraLinks == nil {
		req.ExtraLinks = []extraLink{}
	}
	extraLinksJSON, _ := json.Marshal(req.ExtraLinks)

	bio, err := h.db.UpsertBioPage(r.Context(), db.UpsertBioPageParams{
		UserID:     user.ID,
		Whatsapp:   req.Whatsapp,
		Instagram:  req.Instagram,
		Facebook:   req.Facebook,
		Tiktok:     req.Tiktok,
		Youtube:    req.Youtube,
		ExtraLinks: string(extraLinksJSON),
		Published:  req.Published,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao salvar"})
		return
	}

	writeJSON(w, http.StatusOK, bio)
}

// ── Public Bio Page (GET /bio/{slug}) ─────────────────────────────────────────

func (h *Handler) handleServeBio(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	site, err := h.db.GetSiteBySlug(r.Context(), slug)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	bio, err := h.db.GetBioPageByUserID(r.Context(), site.UserID)
	if err != nil || !bio.Published {
		http.NotFound(w, r)
		return
	}

	// Optional: get logo
	logoSVG := ""
	logo, err := h.db.GetLogoByUserID(r.Context(), site.UserID)
	if err == nil && logo.SelectedIndex >= 0 {
		switch logo.SelectedIndex {
		case 0:
			logoSVG = logo.Svg1
		case 1:
			logoSVG = logo.Svg2
		case 2:
			logoSVG = logo.Svg3
		}
	}

	// Optional: octadesk widget
	octaWidget := ""
	octa, err := h.db.GetOctadeskByUserID(r.Context(), site.UserID)
	if err == nil && octa.Active && octa.WidgetCode != "" {
		octaWidget = octa.WidgetCode
	}

	// Parse extra links
	var extraLinks []extraLink
	_ = json.Unmarshal([]byte(bio.ExtraLinks), &extraLinks)

	htmlContent := renderBioPage(site, bio, logoSVG, octaWidget, extraLinks, h.cfg.BaseURL)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, htmlContent) //nolint:errcheck
}

func renderBioPage(site db.Site, bio db.BioPage, logoSVG, octaWidget string, extraLinks []extraLink, baseURL string) string {
	name := html.EscapeString(site.BusinessName)
	siteURL := fmt.Sprintf("%s/site/%s", baseURL, site.Slug)

	// Logo or initials
	logoHTML := ""
	if logoSVG != "" {
		logoHTML = fmt.Sprintf(`<div class="logo-wrap">%s</div>`, logoSVG)
	} else {
		initial := strings.ToUpper(string([]rune(site.BusinessName)[0:1]))
		logoHTML = fmt.Sprintf(`<div class="initials">%s</div>`, html.EscapeString(initial))
	}

	// Links HTML
	linksHTML := ""

	// Main site
	if site.Published {
		linksHTML += fmt.Sprintf(`<a href="%s" class="link-btn primary" target="_blank" rel="noopener">🌐 Visitar meu site</a>`, html.EscapeString(siteURL))
	}

	// WhatsApp
	if bio.Whatsapp != "" {
		wa := strings.ReplaceAll(bio.Whatsapp, " ", "")
		wa = strings.ReplaceAll(wa, "-", "")
		wa = strings.ReplaceAll(wa, "(", "")
		wa = strings.ReplaceAll(wa, ")", "")
		if !strings.HasPrefix(wa, "55") {
			wa = "55" + wa
		}
		linksHTML += fmt.Sprintf(`<a href="https://wa.me/%s" class="link-btn whatsapp" target="_blank" rel="noopener">💬 Falar no WhatsApp</a>`, wa)
	}

	// Instagram
	if bio.Instagram != "" {
		ig := strings.TrimPrefix(bio.Instagram, "@")
		linksHTML += fmt.Sprintf(`<a href="https://instagram.com/%s" class="link-btn" target="_blank" rel="noopener">📸 Instagram</a>`, html.EscapeString(ig))
	}

	// Facebook
	if bio.Facebook != "" {
		linksHTML += fmt.Sprintf(`<a href="https://facebook.com/%s" class="link-btn" target="_blank" rel="noopener">📘 Facebook</a>`, html.EscapeString(bio.Facebook))
	}

	// TikTok
	if bio.Tiktok != "" {
		tt := strings.TrimPrefix(bio.Tiktok, "@")
		linksHTML += fmt.Sprintf(`<a href="https://tiktok.com/@%s" class="link-btn" target="_blank" rel="noopener">🎵 TikTok</a>`, html.EscapeString(tt))
	}

	// YouTube
	if bio.Youtube != "" {
		linksHTML += fmt.Sprintf(`<a href="https://youtube.com/%s" class="link-btn" target="_blank" rel="noopener">▶️ YouTube</a>`, html.EscapeString(bio.Youtube))
	}

	// Extra links
	for _, el := range extraLinks {
		if el.Label != "" && el.URL != "" {
			linksHTML += fmt.Sprintf(`<a href="%s" class="link-btn" target="_blank" rel="noopener">🔗 %s</a>`,
				html.EscapeString(el.URL), html.EscapeString(el.Label))
		}
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%s — Página Bio</title>
<meta name="description" content="Links de %s">
<meta property="og:title" content="%s">
<meta property="og:type" content="profile">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#1a1a2e 0%%,#16213e 50%%,#0f3460 100%%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px 28px;width:100%%;max-width:400px;text-align:center}
.logo-wrap{margin:0 auto 16px;width:96px;height:96px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);border-radius:20px;overflow:hidden}
.logo-wrap svg{width:80px;height:80px}
.initials{width:96px;height:96px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:900;color:#fff;margin:0 auto 16px}
h1{color:#fff;font-size:1.4rem;font-weight:700;margin-bottom:6px}
.subtitle{color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:28px}
.links{display:flex;flex-direction:column;gap:12px}
.link-btn{display:block;padding:14px 20px;border-radius:14px;text-decoration:none;font-size:0.95rem;font-weight:600;transition:transform 0.15s,opacity 0.15s;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.15)}
.link-btn:hover{transform:translateY(-2px);opacity:0.9;background:rgba(255,255,255,0.18)}
.link-btn.primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);border-color:transparent}
.link-btn.whatsapp{background:linear-gradient(135deg,#25d366,#128c7e);border-color:transparent}
.footer{margin-top:28px;color:rgba(255,255,255,0.3);font-size:0.72rem}
.footer a{color:rgba(255,255,255,0.4);text-decoration:none}
</style>
</head>
<body>
<div class="card">
  %s
  <h1>%s</h1>
  <p class="subtitle">locawebstart.com.br/bio/%s</p>
  <div class="links">%s</div>
  <p class="footer">Criado com <a href="%s">Locaweb Start</a></p>
</div>
%s
</body>
</html>`,
		name, name, name,
		logoHTML,
		name,
		html.EscapeString(site.Slug),
		linksHTML,
		baseURL,
		octaWidget,
	)
}
