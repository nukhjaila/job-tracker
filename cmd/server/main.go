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

	applications, err := st.GetApplications(ctx)
	if err != nil {
		log.Println("Ошибка:", err)
		return
	}

	if len(applications) == 0 {
		log.Println("Нет карточек для обновления")
		return
	}

	app := applications[0]
	app.Status = model.StatusApplied
	app.Notes = "Резюме отправлено"

	if err := st.UpdateApplication(ctx, &app); err != nil {
		log.Println("Ошибка обновления:", err)
		return
	}

	log.Printf(
		"Карточка обновлена: ID=%d | статус=%s | время=%s",
		app.ID,
		app.Status,
		app.UpdatedAt.Format(time.RFC3339),
	)

	// Повторно читаем данные, чтобы проверить результат в базе.
	applications, err = st.GetApplications(ctx)
	if err != nil {
		log.Println("Ошибка:", err)
		return
	}

	for _, app := range applications {
		log.Printf(
			"ID=%d | %s | %s | статус=%s",
			app.ID,
			app.Company,
			app.Position,
			app.Status,
		)
	}
}
