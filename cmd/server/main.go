package main

import (
	"context"
	"log"

	"job-tracker/internal/storage"
)

func main() {
	ctx := context.Background()

	st, err := storage.New(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	log.Println("connected to database")
}
