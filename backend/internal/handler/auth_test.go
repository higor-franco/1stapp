package handler_test

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/higor-franco/1stapp/internal/config"
	"github.com/higor-franco/1stapp/internal/database"
	"github.com/higor-franco/1stapp/internal/handler"
	"github.com/jackc/pgx/v5/pgxpool"
)

func setupTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL não configurado — pulando testes de integração")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("conectar ao banco: %v", err)
	}
	t.Cleanup(pool.Close)

	if err := database.Migrate(ctx, pool); err != nil {
		t.Fatalf("migrations: %v", err)
	}

	cfg := &config.Config{Port: "8080", DevMode: true}
	h := handler.New(pool, cfg)
	srv := httptest.NewServer(h.Routes())
	t.Cleanup(srv.Close)
	return srv
}

func postJSON(t *testing.T, srv *httptest.Server, path string, body any) *http.Response {
	t.Helper()
	b, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, srv.URL+path, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST %s: %v", path, err)
	}
	return resp
}

func randomEmail() string {
	b := make([]byte, 6)
	rand.Read(b) //nolint:errcheck
	return "test_" + hex.EncodeToString(b) + "@example.com"
}

func TestHealth(t *testing.T) {
	srv := setupTestServer(t)
	resp, err := http.Get(srv.URL + "/up")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("esperado 200, recebido %d", resp.StatusCode)
	}
}

func TestRegisterAndLogin(t *testing.T) {
	srv := setupTestServer(t)
	email := randomEmail()

	// Register
	resp := postJSON(t, srv, "/api/auth/register", map[string]string{
		"name": "Teste Usuário", "email": email, "password": "senha12345",
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("register: esperado 201, recebido %d", resp.StatusCode)
	}
	var regBody map[string]any
	json.NewDecoder(resp.Body).Decode(&regBody) //nolint:errcheck
	user := regBody["user"].(map[string]any)
	if user["email"] != email {
		t.Errorf("email incorreto: %v", user["email"])
	}

	// Login
	resp2 := postJSON(t, srv, "/api/auth/login", map[string]string{
		"email": email, "password": "senha12345",
	})
	defer resp2.Body.Close()
	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("login: esperado 200, recebido %d", resp2.StatusCode)
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	srv := setupTestServer(t)
	email := randomEmail()

	postJSON(t, srv, "/api/auth/register", map[string]string{
		"name": "User1", "email": email, "password": "senha12345",
	}).Body.Close()

	resp := postJSON(t, srv, "/api/auth/register", map[string]string{
		"name": "User2", "email": email, "password": "senha12345",
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("esperado 409, recebido %d", resp.StatusCode)
	}
}

func TestLoginWrongPassword(t *testing.T) {
	srv := setupTestServer(t)
	email := randomEmail()

	postJSON(t, srv, "/api/auth/register", map[string]string{
		"name": "User", "email": email, "password": "senha12345",
	}).Body.Close()

	resp := postJSON(t, srv, "/api/auth/login", map[string]string{
		"email": email, "password": "senhaerrada",
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("esperado 401, recebido %d", resp.StatusCode)
	}
}

func TestMeRequiresAuth(t *testing.T) {
	srv := setupTestServer(t)
	resp, _ := http.Get(srv.URL + "/api/auth/me")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("esperado 401, recebido %d", resp.StatusCode)
	}
}
