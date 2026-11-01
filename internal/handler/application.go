package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"job-tracker/internal/model"
	"job-tracker/internal/storage"
	"log"
	"net/http"
	"strconv"
	"strings"
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

func (h *ApplicationHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var app model.Application

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&app); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := decoder.Decode(new(any)); err != io.EOF {
		http.Error(w, "Expected a single JSON object", http.StatusBadRequest)
		return
	}

	app.Company = strings.TrimSpace(app.Company)
	app.Position = strings.TrimSpace(app.Position)

	if app.Company == "" || app.Position == "" {
		http.Error(
			w,
			"Company and position are required",
			http.StatusBadRequest,
		)
		return
	}
	if app.Status == "" {
		app.Status = model.StatusWishlist
	}

	switch app.Status {
	case model.StatusWishlist,
		model.StatusApplied,
		model.StatusInterview,
		model.StatusRejected,
		model.StatusOffer:
	default:
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	if app.PositionInColumn < 0 {
		http.Error(
			w,
			"Position in column must not be negative",
			http.StatusBadRequest,
		)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := h.storage.CreateApplication(ctx, &app); err != nil {
		log.Printf("create application: %v", err)
		http.Error(
			w,
			"Failed to create application",
			http.StatusInternalServerError,
		)
		return
	}

	data, err := json.Marshal(app)
	if err != nil {
		log.Printf("encode application: %v", err)
		http.Error(
			w,
			"Failed to encode application",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if _, err := w.Write(data); err != nil {
		log.Printf("write application response: %v", err)
	}
}

func (h *ApplicationHandler) DeleteApplication(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "Invalid application ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	err = h.storage.DeleteApplication(ctx, id)
	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			http.Error(
				w,
				"Application not found",
				http.StatusNotFound,
			)
			return
		}

		log.Printf("delete application: %v", err)
		http.Error(
			w,
			"Failed to delete application",
			http.StatusInternalServerError,
		)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ApplicationHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "Invalid application ID", http.StatusBadRequest)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var input struct {
		Status string `json:"status"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&input); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := decoder.Decode(new(any)); err != io.EOF {
		http.Error(w, "Expected a single JSON object", http.StatusBadRequest)
		return
	}

	switch input.Status {
	case model.StatusWishlist,
		model.StatusApplied,
		model.StatusInterview,
		model.StatusRejected,
		model.StatusOffer:
	default:
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	err = h.storage.UpdateApplicationStatus(ctx, id, input.Status)
	if err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			http.Error(
				w,
				"Application not found",
				http.StatusNotFound,
			)
			return
		}

		log.Printf("update application status: %v", err)
		http.Error(
			w,
			"Failed to update application status",
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
