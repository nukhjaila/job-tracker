# Job Tracker

A personal Kanban board for tracking internship and job applications. Drag a company card between columns as your search moves forward, so you always know where you applied, who replied, and when your next interview is.

## Columns

- **Wishlist**: companies you plan to apply to
- **Applied**: resume sent, waiting for a reply
- **Interview**: you have been invited to talk
- **Rejected**: closed with a no
- **Offer**: you got in

## Features

- Add, edit and delete application cards
- Drag and drop cards between columns
- Store company, position, vacancy link, interview date and notes
- Data is saved in a local SQLite database

## Tech Stack

- Go (`net/http`)
- SQLite
- Vanilla JavaScript + HTML5 Drag and Drop

## Project Structure

```
job-tracker/
├── cmd/server/        # entry point
├── internal/
│   ├── model/         # data structures
│   ├── storage/       # SQLite and CRUD queries
│   ├── handler/       # HTTP handlers and routes
│   └── service/       # business logic (optional)
├── web/               # frontend (HTML, CSS, JS)
├── migrations/        # SQL migrations
├── Dockerfile
├── Makefile
└── README.md
```

## Getting Started

```bash
git clone https://github.com/<your-username>/job-tracker.git
cd job-tracker
go run ./cmd/server
```

Then open http://localhost:8080 in your browser.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications` | List all applications |
| POST | `/api/applications` | Create an application |
| PUT | `/api/applications/{id}` | Update an application |
| PATCH | `/api/applications/{id}/status` | Move a card to another column |
| DELETE | `/api/applications/{id}` | Delete an application |

## Roadmap

- [ ] Telegram reminders about upcoming interviews
- [ ] Statistics of applications by status
- [ ] Export to CSV

## Author

Mukhammed Abu