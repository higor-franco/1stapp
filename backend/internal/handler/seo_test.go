package handler

import (
	"strings"
	"testing"

	db "github.com/higor-franco/1stapp/internal/database/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

func TestInjectJSONLD(t *testing.T) {
	site := db.Site{
		Slug:                "meu-negocio",
		BusinessName:        "Meu Negócio",
		BusinessDescription: "Uma barbearia em São Paulo",
	}
	baseURL := "https://example.com"

	t.Run("injects JSON-LD before </head>", func(t *testing.T) {
		html := `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`
		result := injectJSONLD(html, site, baseURL)

		if !strings.Contains(result, `application/ld+json`) {
			t.Error("expected JSON-LD script tag")
		}
		if !strings.Contains(result, `"LocalBusiness"`) {
			t.Error("expected LocalBusiness schema type")
		}
		if !strings.Contains(result, `"Meu Negócio"`) {
			t.Error("expected business name in JSON-LD")
		}
		if !strings.Contains(result, `https://example.com/site/meu-negocio`) {
			t.Error("expected site URL in JSON-LD")
		}
		if !strings.Contains(result, `<link rel="canonical"`) {
			t.Error("expected canonical link tag")
		}
	})

	t.Run("skips injection if JSON-LD already present", func(t *testing.T) {
		html := `<!DOCTYPE html><html><head><script type="application/ld+json">{}</script></head><body></body></html>`
		result := injectJSONLD(html, site, baseURL)

		count := strings.Count(result, `application/ld+json`)
		if count != 1 {
			t.Errorf("expected 1 JSON-LD block, got %d", count)
		}
	})

	t.Run("fallback injection when no </head>", func(t *testing.T) {
		html := `<body>Hello</body>`
		result := injectJSONLD(html, site, baseURL)

		if !strings.Contains(result, `application/ld+json`) {
			t.Error("expected JSON-LD even without </head>")
		}
	})
}

func TestSlugify(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"Clínica Bella Pele", "clinica-bella-pele"},
		{"Studio Foto Arte", "studio-foto-arte"},
		{"Advocacia & Silva", "advocacia-silva"},
		{"São Paulo Tech", "sao-paulo-tech"},
		{"", ""},
	}

	for _, tc := range tests {
		got := slugify(tc.input)
		if got != tc.want {
			t.Errorf("slugify(%q) = %q, want %q", tc.input, got, tc.want)
		}
	}
}

func TestToSiteResponse(t *testing.T) {
	var uid pgtype.UUID
	uid.Scan("550e8400-e29b-41d4-a716-446655440000") //nolint:errcheck

	site := db.Site{
		ID:                  uid,
		Slug:                "test-slug",
		BusinessName:        "Test Biz",
		BusinessDescription: "Desc",
		ColorPalette:        "azul",
		HtmlContent:         "<html></html>",
		Published:           true,
		GenerationCount:     3,
	}

	resp := toSiteResponse(site)

	if resp.Slug != "test-slug" {
		t.Errorf("expected slug test-slug, got %s", resp.Slug)
	}
	if resp.URL != "/site/test-slug" {
		t.Errorf("expected URL /site/test-slug, got %s", resp.URL)
	}
	if resp.GenerationCount != 3 {
		t.Errorf("expected generation_count 3, got %d", resp.GenerationCount)
	}
}
