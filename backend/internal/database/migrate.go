package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename   TEXT        PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("create migrations table: %w", err)
	}

	entries, err := fs.ReadDir(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	for _, filename := range files {
		var count int
		if err := pool.QueryRow(ctx,
			"SELECT COUNT(*) FROM schema_migrations WHERE filename = $1", filename,
		).Scan(&count); err != nil {
			return fmt.Errorf("check migration %s: %w", filename, err)
		}
		if count > 0 {
			continue
		}

		content, err := migrationsFS.ReadFile("migrations/" + filename)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", filename, err)
		}
		if _, err := pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("apply migration %s: %w", filename, err)
		}
		if _, err := pool.Exec(ctx,
			"INSERT INTO schema_migrations (filename) VALUES ($1)", filename,
		); err != nil {
			return fmt.Errorf("record migration %s: %w", filename, err)
		}
		slog.Info("applied migration", "file", filename)
	}
	return nil
}
