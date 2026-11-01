# Job Tracker

A personal Kanban board for tracking job and internship applications. Keep company details, vacancy links, interview dates and notes in one place, and move applications through your job search.

Built with **Go, PostgreSQL and vanilla JavaScript**, without a frontend framework or build step.

## Features

- Five application stages: **Wishlist → Applied → Interview → Rejected / Offer**.
- Create, edit and delete application cards.
- Drag cards between columns to update their status.
- Change status through the edit form on touch devices or with a keyboard.
- Store company, position, vacancy URL, interview date and notes.
- Search by company or position and view counts per column.
- Responsive board with horizontal scrolling on smaller screens.
- Custom deletion confirmation and compact notifications.
- PostgreSQL persistence and server-side input validation.
- Failed status changes restore the previous column in the interface.

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Go 1.25+, standard library `net/http` |
| Database | PostgreSQL 16, `pgx/v5`, connection pooling |
| Frontend | HTML, CSS, JavaScript ES modules, HTML5 Drag and Drop |
| Local database environment | Docker Compose |

## Project structure

```text
job-tracker/
├── cmd/server/main.go          # Application entry point and HTTP server
├── internal/
│   ├── model/application.go    # Application model and status constants
│   ├── storage/
│   │   ├── postgres.go         # Database connection pool
│   │   └── application.go      # SQL queries
│   └── handler/
│       ├── application.go      # HTTP handlers and validation
│       └── router.go           # API routes and static file serving
├── migrations/001_init.sql     # Initial database schema
├── web/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js              # HTTP client
│       ├── board.js            # Board rendering and state
│       ├── dnd.js              # Drag and drop
│       ├── form.js             # Create and edit dialog
│       └── utils.js            # Dates, URL handling and notifications
├── docker-compose.yml
├── go.mod
└── go.sum
```

## Getting started

### Requirements

- Go 1.25 or later.
- Docker with Docker Compose.
- Git.

### 1. Get the source

Clone this repository and open its directory in a terminal. Run the following commands from the project root, which contains `go.mod` and `web/`.

### 2. Start PostgreSQL

Review the local database credentials in `docker-compose.yml`, then start the database:

```bash
docker compose up -d
docker compose ps
```

The database is exposed on host port **5433**. Wait until PostgreSQL is ready before applying the schema.

### 3. Apply the initial schema

For Bash, Zsh or Git Bash:

```bash
docker exec -i jobtracker-db psql -v ON_ERROR_STOP=1 -U tracker -d jobtracker < migrations/001_init.sql
```

For PowerShell:

```powershell
Get-Content migrations/001_init.sql | docker exec -i jobtracker-db psql -v ON_ERROR_STOP=1 -U tracker -d jobtracker
```

This script creates the initial table. It does not upgrade an existing schema when its definition changes.

### 4. Set the database connection

Replace `YOUR_PASSWORD` with the password configured for your local database. URL-encode special characters in the password if needed.

For Bash, Zsh or Git Bash:

```bash
export DATABASE_URL='postgres://tracker:YOUR_PASSWORD@localhost:5433/jobtracker?sslmode=disable'
```

For PowerShell:

```powershell
$env:DATABASE_URL = "postgres://tracker:YOUR_PASSWORD@localhost:5433/jobtracker?sslmode=disable"
```

The application reads this environment variable directly. A `.env` file is **not loaded automatically**. The setting above applies only to the current terminal session.

### 5. Run the application

```bash
go mod download
go run ./cmd/server
```

Open **http://localhost:8081/**. The Go server serves both the frontend and API. Do not open `index.html` directly or use a separate frontend server.

Stop the application with **Ctrl+C**.

## REST API

| Method | Endpoint | Successful response |
| --- | --- | --- |
| GET | `/api/applications` | `200 OK`, JSON array |
| POST | `/api/applications` | `201 Created`, created card |
| PUT | `/api/applications/{id}` | `200 OK`, updated card |
| PATCH | `/api/applications/{id}/status` | `204 No Content` |
| DELETE | `/api/applications/{id}` | `204 No Content` |

Invalid input returns `400`; a missing card returns `404`; an unexpected server error returns `500`. Error bodies are plain text. Responses with status `204` have no body.

### Create an application

```bash
curl -i -X POST http://localhost:8081/api/applications \
  -H 'Content-Type: application/json' \
  -d '{"company":"Example Company","position":"Go Intern","notes":"Prepare resume"}'
```

`company` and `position` are required. Omitted status defaults to `wishlist`.

### Change status

Replace `123` with an ID returned by the API:

```bash
curl -i -X PATCH http://localhost:8081/api/applications/123/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"applied"}'
```

Allowed statuses: `wishlist`, `applied`, `interview`, `rejected`, `offer`.

### Update an application

PUT replaces all editable fields. Omitted optional fields are cleared. Send `position_in_column` with its existing value when editing a card. Do not send `id`, `created_at` or `updated_at` in the request body.

```json
{
  "company": "Example Company",
  "position": "Go Backend Intern",
  "url": "https://example.com/jobs/123",
  "status": "interview",
  "interview_date": "2026-12-01T14:00:00+05:00",
  "notes": "Prepare for the interview",
  "position_in_column": 0
}
```

Interview dates use RFC3339 with a time zone, or `null` when unset. The frontend displays dates in the browser's local time zone.

## Current scope

- This is a single-user local application without authentication or per-user data isolation. Keep it local or place it behind access control before exposing a deployed instance.
- Drag and drop changes status only. Custom ordering within columns is not implemented.
- The server currently listens on `localhost:8081`; configure the bind address appropriately before container deployment.
- The schema is applied manually. There is no automatic migration runner.
- API behavior has been checked manually with curl and the browser; automated tests are a planned improvement.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `DATABASE_URL environment variable is not set` | Set it in the same terminal used to run Go. |
| Database connection refused | Check `docker compose ps`, database readiness and port `5433`. |
| Password authentication failed | Check the credentials used when the database volume was first initialized. Editing Compose does not change an existing database password. |
| `address already in use` | Stop the previous server or change its configured port. |
| Frontend files return 404 | Start the application from the project root. |

Database files persist in the Docker volume. `docker compose down -v` deletes that volume and its data.

## Roadmap

- [ ] Persist custom card ordering.
- [ ] Add automated API and storage tests.
- [ ] Complete Dockerfile and Makefile.
- [ ] Add automated migrations and deployment instructions.
- [ ] Export applications to CSV.
- [ ] Add interview reminders.

## Author

Mukhammed Abu
