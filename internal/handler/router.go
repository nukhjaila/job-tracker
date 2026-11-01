package handler

import (
	"job-tracker/internal/storage"
	"net/http"
)

func NewRouter(st *storage.Storage) *http.ServeMux {
	mux := http.NewServeMux()

	h := NewApplicationHandler(st)
	mux.HandleFunc("GET /api/applications", h.GetApplications)
	mux.HandleFunc("POST /api/applications", h.CreateApplication)
	mux.HandleFunc("DELETE /api/applications/{id}", h.DeleteApplication)
	mux.HandleFunc("PATCH /api/applications/{id}/status", h.UpdateApplicationStatus)
	mux.HandleFunc("PUT /api/applications/{id}", h.UpdateApplication)
	return mux
}
