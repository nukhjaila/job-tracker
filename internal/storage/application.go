package storage

import (
	"context"
	"fmt"
	"job-tracker/internal/model"
)

func (s *Storage) CreateApplication(ctx context.Context, app *model.Application) error {
	query := `
		INSERT INTO applications (
			company,
			position,
			url,
			status,
			interview_date,
			notes,
			position_in_column
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	err := s.pool.QueryRow(
		ctx,
		query,
		app.Company,
		app.Position,
		app.URL,
		app.Status,
		app.InterviewDate,
		app.Notes,
		app.PositionInColumn,
	).Scan(
		&app.ID,
		&app.CreatedAt,
		&app.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("create application: %w", err)
	}

	return nil
}
