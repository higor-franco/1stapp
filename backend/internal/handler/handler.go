package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"

	"github.com/higor-franco/1stapp/internal/config"
	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type contextKey string

const userContextKey contextKey = "user"

type Handler struct {
	db   *db.Queries
	pool *pgxpool.Pool
	cfg  *config.Config
}

func New(pool *pgxpool.Pool, cfg *config.Config) *Handler {
	return &Handler{
		db:   db.New(pool),
		pool: pool,
		cfg:  cfg,
	}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("GET /up", h.handleHealth)

	// Auth
	mux.HandleFunc("POST /api/auth/register", h.handleRegister)
	mux.HandleFunc("POST /api/auth/login", h.handleLogin)
	mux.HandleFunc("POST /api/auth/logout", h.handleLogout)
	mux.HandleFunc("GET /api/auth/me", h.requireAuth(h.handleMe))

	// Sites
	mux.HandleFunc("GET /api/sites/me", h.requireAuth(h.handleGetMySite))
	mux.HandleFunc("POST /api/sites/generate", h.requireAuth(h.handleGenerateSite))
	mux.HandleFunc("PUT /api/sites/publish", h.requireAuth(h.handlePublishSite))
	mux.HandleFunc("GET /api/sites/preview", h.requireAuth(h.handlePreviewSite))

	// Logos
	mux.HandleFunc("GET /api/logos/me", h.requireAuth(h.handleGetMyLogo))
	mux.HandleFunc("POST /api/logos/generate", h.requireAuth(h.handleGenerateLogo))
	mux.HandleFunc("PUT /api/logos/select", h.requireAuth(h.handleSelectLogo))

	// Subscription & payments
	mux.HandleFunc("POST /api/subscription/upgrade", h.requireAuth(h.handleUpgrade))
	mux.HandleFunc("GET /api/subscription/me", h.requireAuth(h.handleGetSubscription))
	mux.HandleFunc("POST /api/subscription/cancel", h.requireAuth(h.handleCancelSubscription))
	mux.HandleFunc("GET /api/payment-addon", h.requireAuth(h.handleGetPaymentAddon))
	mux.HandleFunc("POST /api/payment-addon", h.requireAuth(h.handleSavePaymentAddon))

	// Vindi webhook (public)
	mux.HandleFunc("POST /api/webhooks/vindi", h.handleVindiWebhook)

	// Bio page
	mux.HandleFunc("GET /api/bio/me", h.requireAuth(h.handleGetBio))
	mux.HandleFunc("POST /api/bio", h.requireAuth(h.handleSaveBio))
	mux.HandleFunc("GET /bio/{slug}", h.handleServeBio)

	// Octadesk
	mux.HandleFunc("GET /api/octadesk", h.requireAuth(h.handleGetOctadesk))
	mux.HandleFunc("POST /api/octadesk", h.requireAuth(h.handleSaveOctadesk))

	// Domain
	mux.HandleFunc("GET /api/domain/me", h.requireAuth(h.handleGetDomain))
	mux.HandleFunc("POST /api/domain/configure", h.requireAuth(h.handleConfigureDomain))
	mux.HandleFunc("DELETE /api/domain/configure", h.requireAuth(h.handleRemoveDomain))
	mux.HandleFunc("GET /api/domain/verify", h.requireAuth(h.handleVerifyDomain))

	// Public site serving
	mux.HandleFunc("GET /site/{slug}", h.handleServeSite)

	// SEO / discovery
	mux.HandleFunc("GET /robots.txt", h.handleRobotsTxt)
	mux.HandleFunc("GET /sitemap.xml", h.handleSitemapXML)
	mux.HandleFunc("GET /llms.txt", h.handleLlmsTxt)

	// Dev-only login (only when DEV_MODE=1)
	if h.cfg.DevMode {
		mux.HandleFunc("POST /api/dev/login", h.handleDevLogin)
	}

	// Static assets
	mux.Handle("/assets/", http.StripPrefix("/assets/",
		http.FileServer(http.Dir(filepath.Join("frontend", "dist", "assets")))))

	// SPA fallback
	mux.HandleFunc("/", h.handleSPA)

	return h.customDomainMiddleware(mux)
}

func (h *Handler) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session")
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "não autorizado"})
			return
		}
		session, err := h.db.GetSessionByToken(r.Context(), cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "sessão inválida"})
			return
		}
		user, err := h.db.GetUserByID(r.Context(), session.UserID)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "usuário não encontrado"})
			return
		}
		ctx := context.WithValue(r.Context(), userContextKey, user)
		next(w, r.WithContext(ctx))
	}
}

func userFromCtx(r *http.Request) db.User {
	return r.Context().Value(userContextKey).(db.User)
}

func (h *Handler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok")) //nolint:errcheck
}

func (h *Handler) handleSPA(w http.ResponseWriter, r *http.Request) {
	indexPath := filepath.Join("frontend", "dist", "index.html")
	if _, err := os.Stat(indexPath); os.IsNotExist(err) {
		// dev mode: just return 200 (Vite handles the frontend)
		w.WriteHeader(http.StatusOK)
		return
	}
	http.ServeFile(w, r, indexPath)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("writeJSON encode error", "err", err)
	}
}

func readJSON(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}
