package main

import (
	"context"
	"log"
	"time"

	"job-tracker/internal/model"
	"job-tracker/internal/storage"
)

func main() {
	st, err := storage.New(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	app := model.Application{
		Company:  "Doodocs",
		Position: "Go Intern",
		Status:   model.StatusWishlist,
		Notes:    "Первая тестовая карточка",
	}

	log.Printf("Передаём статус: %q", app.Status)
	if err := st.CreateApplication(ctx, &app); err != nil {
		log.Println("Ошибка:", err)
		return
	}

	log.Printf("Карточка создана: ID=%d, компания=%s", app.ID, app.Company)
}
