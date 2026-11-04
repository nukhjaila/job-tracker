package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"job-tracker/internal/handler"
	"job-tracker/internal/storage"

	"github.com/joho/godotenv"
)

func main() {

	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Printf("Failed to load .env: %v", err)
		return
	}

	st, err := storage.New(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	server := &http.Server{
		Addr:              "localhost:8081",
		Handler:           handler.NewRouter(st),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Println("Server running at http://localhost:8081")

	if err := server.ListenAndServe(); err != nil &&
		!errors.Is(err, http.ErrServerClosed) {
		log.Printf("Server error: %v", err)
	}
}
