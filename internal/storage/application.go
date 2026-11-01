package storage

import (
	"context"
	"errors"
	"fmt"
	"job-tracker/internal/model"

	"github.com/jackc/pgx/v5"
)

var ErrNotFound = errors.New("application not found")

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

func (s *Storage) GetApplications(ctx context.Context) ([]model.Application, error) {
	query := `
		SELECT
			id,company,position,url,status,interview_date,notes,position_in_column,created_at,updated_at
		FROM applications
		ORDER BY status, position_in_column, id
	`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get applications: %w", err)
	}
	defer rows.Close()
	applications := make([]model.Application, 0)
	for rows.Next() {
		var app model.Application
		err := rows.Scan(
			&app.ID,
			&app.Company,
			&app.Position,
			&app.URL,
			&app.Status,
			&app.InterviewDate,
			&app.Notes,
			&app.PositionInColumn,
			&app.CreatedAt,
			&app.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("get applications: %w", err)
		}
		applications = append(applications, app)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("get applications: %w", err)
	}
	return applications, nil
}

func (s *Storage) UpdateApplication(ctx context.Context, app *model.Application) error {
	qury := `
		UPDATE applications
		SET
			company = $1,
			position = $2,	
			url = $3,
			status = $4,
			interview_date = $5,
			notes = $6,
			position_in_column = $7,
			updated_at = NOW()
		WHERE id = $8
		RETURNING created_at, updated_at
	`
	err := s.pool.QueryRow(
		ctx,
		qury,
		app.Company,
		app.Position,
		app.URL,
		app.Status,
		app.InterviewDate,
		app.Notes,
		app.PositionInColumn,
		app.ID,
	).Scan(
		&app.CreatedAt,
		&app.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("update application: %w", err)
	}
	return nil
}

func (s *Storage) DeleteApplication(ctx context.Context, id int) error {
	query := `
		DELETE FROM applications
		WHERE id = $1
	`
	result, err := s.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete application: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
