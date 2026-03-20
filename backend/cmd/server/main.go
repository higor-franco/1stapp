package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/higor-franco/1stapp/internal/config"
	"github.com/higor-franco/1stapp/internal/database"
	"github.com/higor-franco/1stapp/internal/handler"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		slog.Error("DATABASE_URL não configurado")
		os.Exit(1)
	}

	ctx := context.Background()

	var pool *pgxpool.Pool
	var err error
	for i := range 6 {
		pool, err = pgxpool.New(ctx, cfg.DatabaseURL)
		if err == nil {
			if err = pool.Ping(ctx); err == nil {
				break
			}
			pool.Close()
		}
		delay := time.Second * (1 << i)
		slog.Warn("banco não disponível, tentando novamente", "tentativa", i+1, "delay", delay, "err", err)
		time.Sleep(delay)
	}
	if err != nil {
		slog.Error("falha ao conectar ao banco de dados", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("conectado ao banco de dados")

	if err := database.Migrate(ctx, pool); err != nil {
		slog.Error("falha ao executar migrations", "err", err)
		os.Exit(1)
	}

	h := handler.New(pool, cfg)

	addr := ":" + cfg.Port
	slog.Info("servidor iniciado", "addr", addr, "dev_mode", cfg.DevMode)
	if err := http.ListenAndServe(addr, h.Routes()); err != nil {
		slog.Error("erro no servidor", "err", err)
		os.Exit(1)
	}
}
