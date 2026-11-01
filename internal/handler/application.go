package handler

import (
	"context"
	"encoding/json"
	"job-tracker/internal/storage"
	"log"
	"net/http"
	"time"
)

type ApplicationHandler struct {
	storage *storage.Storage
}

func NewApplicationHandler(st *storage.Storage) *ApplicationHandler {
	return &ApplicationHandler{
		storage: st,
	}
}

func (h *ApplicationHandler) GetApplications(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	applications, err := h.storage.GetApplications(ctx)
	if err != nil {
		log.Printf("get applications: %v", err)
		http.Error(
			w,
			"Failed to load applications",
			http.StatusInternalServerError,
		)
		return
	}

	data, err := json.Marshal(applications)
	if err != nil {
		log.Printf("encode applications: %v", err)
		http.Error(
			w,
			"Failed to encode applications",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if _, err := w.Write(data); err != nil {
		log.Printf("write applications response: %v", err)
	}
}
