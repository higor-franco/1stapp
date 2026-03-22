package handler

import (
	"strings"
	"testing"
)

func TestExtractHTML(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "plain HTML unchanged",
			input: "<!DOCTYPE html><html></html>",
			want:  "<!DOCTYPE html><html></html>",
		},
		{
			name:  "strips ```html fence",
			input: "```html\n<!DOCTYPE html><html></html>\n```",
			want:  "<!DOCTYPE html><html></html>",
		},
		{
			name:  "strips plain ``` fence",
			input: "```\n<!DOCTYPE html><html></html>\n```",
			want:  "<!DOCTYPE html><html></html>",
		},
		{
			name:  "trims surrounding whitespace",
			input: "  \n<!DOCTYPE html><html></html>\n  ",
			want:  "<!DOCTYPE html><html></html>",
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := extractHTML(tc.input)
			if got != tc.want {
				t.Errorf("extractHTML(%q)\ngot:  %q\nwant: %q", tc.input, got, tc.want)
			}
		})
	}
}

func TestColorPaletteHint(t *testing.T) {
	knownPalettes := []string{"azul", "verde", "roxo", "laranja", "vermelho", "preto", "rosa"}
	for _, p := range knownPalettes {
		hint := colorPaletteHint(p)
		if hint == "" {
			t.Errorf("colorPaletteHint(%q) returned empty string", p)
		}
		// Known palettes should return hex color definitions
		if !strings.Contains(hint, "#") {
			t.Errorf("colorPaletteHint(%q) expected hex colors, got: %q", p, hint)
		}
	}

	// Unknown palette falls back to a generic description
	unknown := colorPaletteHint("turquesa")
	if !strings.Contains(unknown, "turquesa") {
		t.Errorf("fallback hint should mention palette name, got: %q", unknown)
	}
}
