package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

type geminiClient struct {
	apiKey string
	client *http.Client
}

func newGeminiClient(apiKey string) *geminiClient {
	return &geminiClient{
		apiKey: apiKey,
		client: &http.Client{Timeout: 90 * time.Second},
	}
}

type geminiReqBody struct {
	Contents         []geminiContent        `json:"contents"`
	GenerationConfig geminiGenerationConfig `json:"generationConfig"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func (c *geminiClient) generateSite(ctx context.Context, businessName, description, colorPalette string) (string, error) {
	prompt := buildSitePrompt(businessName, description, colorPalette)

	reqBody := geminiReqBody{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
		GenerationConfig: geminiGenerationConfig{
			Temperature:     0.7,
			MaxOutputTokens: 8192,
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s?key=%s", geminiEndpoint, c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(respBytes, &gemResp); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}

	if gemResp.Error != nil {
		return "", fmt.Errorf("gemini error: %s", gemResp.Error.Message)
	}

	if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("resposta vazia do Gemini")
	}

	html := gemResp.Candidates[0].Content.Parts[0].Text
	html = extractHTML(html)
	return html, nil
}

// checkLLMPresence asks Gemini if businessName appears in results for keyword.
// Returns (mentioned bool, snippet string).
func (c *geminiClient) checkLLMPresence(ctx context.Context, businessName, keyword string) (bool, string, error) {
	prompt := fmt.Sprintf(
		`Quais são as empresas mais conhecidas e recomendadas para "%s" no Brasil? Liste até 5 nomes de empresas reais.`,
		keyword,
	)
	reqBody := geminiReqBody{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
		GenerationConfig: geminiGenerationConfig{
			Temperature:     0.0,
			MaxOutputTokens: 512,
		},
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return false, "", fmt.Errorf("marshal: %w", err)
	}
	url := fmt.Sprintf("%s?key=%s", geminiEndpoint, c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return false, "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.client.Do(req)
	if err != nil {
		return false, "", fmt.Errorf("gemini request: %w", err)
	}
	defer resp.Body.Close()
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, "", fmt.Errorf("read: %w", err)
	}
	var gemResp geminiResponse
	if err := json.Unmarshal(respBytes, &gemResp); err != nil {
		return false, "", fmt.Errorf("parse: %w", err)
	}
	if gemResp.Error != nil {
		return false, "", fmt.Errorf("gemini error: %s", gemResp.Error.Message)
	}
	if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
		return false, "", nil
	}
	text := gemResp.Candidates[0].Content.Parts[0].Text
	mentioned := strings.Contains(strings.ToLower(text), strings.ToLower(businessName))
	snippet := text
	if len(snippet) > 300 {
		snippet = snippet[:300] + "…"
	}
	return mentioned, snippet, nil
}

func (c *geminiClient) editSite(ctx context.Context, currentHTML, instruction string) (string, error) {
	// Truncate HTML to avoid exceeding token limits (~50k chars ≈ ~12k tokens)
	if len(currentHTML) > 50000 {
		currentHTML = currentHTML[:50000] + "\n<!-- truncado -->"
	}

	prompt := fmt.Sprintf(`Você é um desenvolvedor web especialista. Abaixo está o HTML completo de um site existente.

## Instrução do usuário:
%s

## HTML atual do site:
%s

## Regras obrigatórias:
- Aplique APENAS a instrução solicitada, preservando todo o restante do site intacto
- Mantenha o mesmo estilo visual, cores e estrutura
- Retorne APENAS o HTML completo atualizado, iniciando com <!DOCTYPE html> e terminando com </html>
- Zero texto explicativo antes ou depois do HTML`,
		instruction, currentHTML)

	reqBody := geminiReqBody{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
		GenerationConfig: geminiGenerationConfig{
			Temperature:     0.3,
			MaxOutputTokens: 8192,
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	url := fmt.Sprintf("%s?key=%s", geminiEndpoint, c.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(respBytes, &gemResp); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}
	if gemResp.Error != nil {
		return "", fmt.Errorf("gemini error: %s", gemResp.Error.Message)
	}
	if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("resposta vazia do Gemini")
	}

	html := gemResp.Candidates[0].Content.Parts[0].Text
	return extractHTML(html), nil
}

// extractHTML strips markdown code fences if Gemini wraps the output
func extractHTML(s string) string {
	s = strings.TrimSpace(s)
	// Remove ```html ... ``` or ``` ... ```
	if strings.HasPrefix(s, "```") {
		lines := strings.SplitN(s, "\n", 2)
		if len(lines) == 2 {
			s = lines[1]
		}
		if idx := strings.LastIndex(s, "```"); idx != -1 {
			s = s[:idx]
		}
	}
	return strings.TrimSpace(s)
}

func buildSitePrompt(businessName, description, colorPalette string) string {
	paletteHint := colorPaletteHint(colorPalette)
	return fmt.Sprintf(`Você é um designer web especialista. Crie um site profissional completo para o seguinte negócio brasileiro.

## Informações do negócio:
- Nome: %s
- Descrição: %s
- Tema visual: %s

## Requisitos técnicos obrigatórios:
- Um ÚNICO arquivo HTML com CSS interno (tag <style>) e JS mínimo (tag <script>)
- Design moderno, limpo e altamente profissional
- Totalmente responsivo — mobile-first com media queries
- Google Fonts: use <link> para carregar Inter ou Poppins
- Ícones: apenas SVG inline ou caracteres Unicode (PROIBIDO FontAwesome, Bootstrap Icons, etc.)
- PROIBIDO qualquer biblioteca JS externa (sem jQuery, React, Vue, etc.)
- PROIBIDO imagens de URLs externas — use gradientes CSS, shapes SVG ou divs coloridos como placeholders

## Estrutura de seções (todas obrigatórias):
1. Navbar fixa no topo com logo (texto) e âncoras para as seções
2. Hero: headline impactante + subtítulo + botão CTA chamativo
3. Sobre / Serviços: 3 cards com ícone SVG, título e descrição
4. Diferenciais ou Por que nos escolher: 3 itens em layout horizontal
5. Depoimentos: 2 depoimentos fictícios mas realistas para o segmento
6. Contato: formulário (nome, email, mensagem) + botão enviar estilizado
7. Footer com nome do negócio, copyright e "Site criado com Locaweb Start"

## SEO — incluir no <head>:
- <title>Nome do Negócio | Serviço Principal</title>
- <meta name="description" content="...">
- <meta name="viewport" content="width=device-width, initial-scale=1.0">
- <meta property="og:title"> e <meta property="og:description">
- <html lang="pt-BR">

## Paleta de cores:
%s

## Qualidade esperada:
- Aparência de site profissional que custaria R$5.000+ se feito por um designer
- Espaçamento generoso, hierarquia tipográfica clara
- Hover effects suaves nos botões e cards
- Scroll suave para âncoras

IMPORTANTE: Retorne APENAS o código HTML completo, iniciando exatamente com <!DOCTYPE html> e terminando com </html>. Zero texto antes ou depois.`,
		businessName, description, colorPalette, paletteHint)
}

func colorPaletteHint(palette string) string {
	hints := map[string]string{
		"azul":     "Primária: #1a4fff (azul vibrante), Secundária: #0028b5 (azul escuro), Acento: #4d7bff, Fundo: #f0f4ff, Texto: #1a1a2e",
		"verde":    "Primária: #16a34a (verde profissional), Secundária: #14532d (verde escuro), Acento: #4ade80, Fundo: #f0fdf4, Texto: #14532d",
		"roxo":     "Primária: #7c3aed (roxo vibrante), Secundária: #4c1d95 (roxo escuro), Acento: #a78bfa, Fundo: #f5f3ff, Texto: #2e1065",
		"laranja":  "Primária: #ea580c (laranja enérgico), Secundária: #9a3412 (laranja escuro), Acento: #fb923c, Fundo: #fff7ed, Texto: #431407",
		"vermelho": "Primária: #dc2626 (vermelho forte), Secundária: #991b1b (vermelho escuro), Acento: #f87171, Fundo: #fef2f2, Texto: #450a0a",
		"preto":    "Primária: #111827 (quase preto), Secundária: #374151, Acento: #f59e0b (dourado), Fundo: #f9fafb, Texto: #111827",
		"rosa":     "Primária: #db2777 (rosa intenso), Secundária: #9d174d (rosa escuro), Acento: #f472b6, Fundo: #fdf2f8, Texto: #500724",
	}
	if hint, ok := hints[strings.ToLower(palette)]; ok {
		return hint
	}
	return fmt.Sprintf("Use uma paleta profissional baseada no tema '%s' com cores harmônicas e contrastantes", palette)
}
