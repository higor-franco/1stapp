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

const anthropicEndpoint = "https://api.anthropic.com/v1/messages"
const anthropicVersion = "2023-06-01"
const anthropicModel = "claude-3-5-haiku-20241022"

type anthropicClient struct {
	apiKey string
	client *http.Client
}

func newAnthropicClient(apiKey string) *anthropicClient {
	return &anthropicClient{
		apiKey: apiKey,
		client: &http.Client{Timeout: 120 * time.Second},
	}
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicReqBody struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	Messages  []anthropicMessage `json:"messages"`
}

type anthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// logoOptions holds the three SVG logos returned by Claude.
type logoOptions struct {
	SVG1 string
	SVG2 string
	SVG3 string
}

func (c *anthropicClient) generateLogos(ctx context.Context, businessName, businessDescription string) (*logoOptions, error) {
	prompt := buildLogoPrompt(businessName, businessDescription)

	reqBody := anthropicReqBody{
		Model:     anthropicModel,
		MaxTokens: 4096,
		Messages: []anthropicMessage{
			{Role: "user", Content: prompt},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, anthropicEndpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", anthropicVersion)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("anthropic request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var anthResp anthropicResponse
	if err := json.Unmarshal(respBytes, &anthResp); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if anthResp.Error != nil {
		return nil, fmt.Errorf("claude error: %s", anthResp.Error.Message)
	}

	if len(anthResp.Content) == 0 {
		return nil, fmt.Errorf("resposta vazia do Claude")
	}

	text := anthResp.Content[0].Text
	return extractLogos(text)
}

// extractLogos parses the three SVG logos from Claude's JSON response.
func extractLogos(text string) (*logoOptions, error) {
	text = strings.TrimSpace(text)

	// Strip markdown code fences if present
	if strings.HasPrefix(text, "```") {
		lines := strings.SplitN(text, "\n", 2)
		if len(lines) == 2 {
			text = lines[1]
		}
		if idx := strings.LastIndex(text, "```"); idx != -1 {
			text = text[:idx]
		}
		text = strings.TrimSpace(text)
	}

	var parsed struct {
		Logos []string `json:"logos"`
	}
	if err := json.Unmarshal([]byte(text), &parsed); err != nil {
		return nil, fmt.Errorf("parse logos JSON: %w (raw: %.200s)", err, text)
	}
	if len(parsed.Logos) < 3 {
		return nil, fmt.Errorf("expected 3 logos, got %d", len(parsed.Logos))
	}

	return &logoOptions{
		SVG1: strings.TrimSpace(parsed.Logos[0]),
		SVG2: strings.TrimSpace(parsed.Logos[1]),
		SVG3: strings.TrimSpace(parsed.Logos[2]),
	}, nil
}

func buildLogoPrompt(businessName, businessDescription string) string {
	return fmt.Sprintf(`You are a professional SVG logo designer specializing in Brazilian businesses.

Create 3 distinct SVG logo options for this business:
- Name: %s
- Description: %s

Requirements for each SVG logo:
- viewBox="0 0 300 100" (wide format, suitable for headers)
- Self-contained: all colors inline, no external fonts or images
- Include the business name as readable text
- Include a simple geometric icon/shape that represents the business
- Each option must have a clearly distinct visual style:
  Option 1: Modern & Minimal (clean lines, single accent color, sans-serif)
  Option 2: Bold & Vibrant (strong colors, solid shapes, prominent icon)
  Option 3: Elegant & Professional (refined, subtle gradient or dual tone, premium feel)
- No JavaScript, no animations, no external references
- Keep each SVG under 40 lines

Return ONLY a valid JSON object — no explanations, no markdown, no extra text:
{"logos":["<svg viewBox=\"0 0 300 100\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>","<svg viewBox=\"0 0 300 100\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>","<svg viewBox=\"0 0 300 100\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>"]}`,
		businessName, businessDescription)
}
