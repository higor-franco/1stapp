package config

import "os"

type Config struct {
	DatabaseURL   string
	Port          string
	DevMode       bool
	GeminiAPIKey  string
	ClaudeAPIKey  string
	BaseURL       string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:" + port
	}
	return &Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		Port:         port,
		DevMode:      os.Getenv("DEV_MODE") == "1",
		GeminiAPIKey: os.Getenv("GEMINI_API_KEY"),
		ClaudeAPIKey: os.Getenv("CLAUDE_API_KEY"),
		BaseURL:      baseURL,
	}
}
