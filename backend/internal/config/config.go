package config

import "os"

type Config struct {
	DatabaseURL   string
	Port          string
	DevMode       bool
	GeminiAPIKey  string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return &Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		Port:         port,
		DevMode:      os.Getenv("DEV_MODE") == "1",
		GeminiAPIKey: os.Getenv("GEMINI_API_KEY"),
	}
}
