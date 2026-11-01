package model

import "time"

type Application struct {
	ID               int       `json:"id"`
	Company          string    `json:"company"`
	Position         string    `json:"position"`
	URL              string    `json:"url"`
	Status           string    `json:"status"`
	InterviewDate    time.Time `json:"interview_date"`
	Notes            string    `json:"notes"`
	PositionInColumn int       `json:"position_in_column"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}
