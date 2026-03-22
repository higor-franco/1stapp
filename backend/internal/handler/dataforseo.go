package handler

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const dataForSEOEndpoint = "https://api.dataforseo.com/v3/serp/google/organic/live/regular"

type dataForSEOClient struct {
	login    string
	password string
	client   *http.Client
}

func newDataForSEOClient(login, password string) *dataForSEOClient {
	return &dataForSEOClient{
		login:    login,
		password: password,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

type dfsTask struct {
	Keyword      string `json:"keyword"`
	LocationCode int    `json:"location_code"` // 1001764 = Brazil
	LanguageCode string `json:"language_code"`
	Depth        int    `json:"depth"`
}

type dfsResponse struct {
	Tasks []struct {
		Result []struct {
			Items []struct {
				Type         string `json:"type"`
				RankAbsolute int    `json:"rank_absolute"`
				Domain       string `json:"domain"`
			} `json:"items"`
		} `json:"result"`
	} `json:"tasks"`
	StatusCode    int    `json:"status_code"`
	StatusMessage string `json:"status_message"`
}

// getRank returns the organic rank (1-based) of domain for keyword, or 0 if not found.
func (c *dataForSEOClient) getRank(ctx context.Context, keyword, domain string) (int, error) {
	tasks := []dfsTask{{
		Keyword:      keyword,
		LocationCode: 1001764, // Brazil
		LanguageCode: "pt",
		Depth:        100,
	}}

	body, err := json.Marshal(tasks)
	if err != nil {
		return 0, fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, dataForSEOEndpoint, bytes.NewReader(body))
	if err != nil {
		return 0, fmt.Errorf("create request: %w", err)
	}
	creds := base64.StdEncoding.EncodeToString([]byte(c.login + ":" + c.password))
	req.Header.Set("Authorization", "Basic "+creds)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("request: %w", err)
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("read: %w", err)
	}

	var dfsResp dfsResponse
	if err := json.Unmarshal(b, &dfsResp); err != nil {
		return 0, fmt.Errorf("parse: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("dataforseo status %d: %s", resp.StatusCode, dfsResp.StatusMessage)
	}

	// Find domain rank among organic results
	for _, task := range dfsResp.Tasks {
		for _, result := range task.Result {
			for _, item := range result.Items {
				if item.Type == "organic" && strings.Contains(item.Domain, domain) {
					return item.RankAbsolute, nil
				}
			}
		}
	}
	return 0, nil // not found in top 100
}
