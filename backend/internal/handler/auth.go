package handler

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

const sessionDuration = 30 * 24 * time.Hour

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Plan  string `json:"plan"`
}

func uuidToString(u pgtype.UUID) string {
	b := u.Bytes
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

func toUserResponse(u db.User) userResponse {
	return userResponse{
		ID:    uuidToString(u.ID),
		Email: u.Email,
		Name:  u.Name,
		Plan:  u.Plan,
	}
}

func toTimestamptz(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

func (h *Handler) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.Name == "" || req.Email == "" || len(req.Password) < 8 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "nome, e-mail e senha (mín. 8 caracteres) são obrigatórios"})
		return
	}
	if !isValidEmail(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "e-mail inválido"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("bcrypt error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	user, err := h.db.CreateUser(r.Context(), db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
	})
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "e-mail já cadastrado"})
			return
		}
		slog.Error("create user error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao criar conta"})
		return
	}

	token, err := newSessionToken()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	if _, err := h.db.CreateSession(r.Context(), db.CreateSessionParams{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: toTimestamptz(time.Now().Add(sessionDuration)),
	}); err != nil {
		slog.Error("create session error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao criar sessão"})
		return
	}

	setSessionCookie(w, token)
	writeJSON(w, http.StatusCreated, map[string]any{"user": toUserResponse(user)})
}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	user, err := h.db.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "e-mail ou senha incorretos"})
			return
		}
		slog.Error("get user error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "e-mail ou senha incorretos"})
		return
	}

	token, err := newSessionToken()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}
	if _, err := h.db.CreateSession(r.Context(), db.CreateSessionParams{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: toTimestamptz(time.Now().Add(sessionDuration)),
	}); err != nil {
		slog.Error("create session error", "err", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro ao criar sessão"})
		return
	}

	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]any{"user": toUserResponse(user)})
}

func (h *Handler) handleLogout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err == nil {
		if err := h.db.DeleteSession(r.Context(), cookie.Value); err != nil {
			slog.Warn("delete session error", "err", err)
		}
	}
	clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
}

func (h *Handler) handleMe(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r)
	writeJSON(w, http.StatusOK, toUserResponse(user))
}

func (h *Handler) handleDevLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "requisição inválida"})
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	hash, _ := bcrypt.GenerateFromPassword([]byte("devpassword"), bcrypt.MinCost)
	_, _ = h.db.CreateUser(r.Context(), db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         "Dev User",
	})

	user, err := h.db.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "erro interno"})
		return
	}

	token, _ := newSessionToken()
	_, _ = h.db.CreateSession(r.Context(), db.CreateSessionParams{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: toTimestamptz(time.Now().Add(sessionDuration)),
	})

	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]any{"user": toUserResponse(user)})
}

func newSessionToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(sessionDuration.Seconds()),
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func isValidEmail(email string) bool {
	at := strings.LastIndex(email, "@")
	if at < 1 {
		return false
	}
	domain := email[at+1:]
	return strings.Contains(domain, ".") && len(domain) > 2
}
