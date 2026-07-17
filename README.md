# Task Manager

A simple, self-contained Flask web application for managing personal tasks. Includes session-based login, a Bootstrap 5 UI, a full REST API for task CRUD operations, search, and a status workflow (Open → In Progress → Completed).

## Features

- Username/password login and logout (Flask-Login, hashed passwords)
- Task CRUD (create, read, update, delete) scoped to the logged-in user
- Search tasks by title/description
- Status dropdown per task (Open, In Progress, Completed)
- SQLite database (via SQLAlchemy), auto-created on first run
- Bootstrap 5 UI with modals for create/edit/delete
- REST JSON API for all task operations
- `/health` endpoint for uptime/monitoring checks
- Dockerfile for containerized deployment

## Project Structure

```
taskmanager/
├── app.py                 # Application factory, /health endpoint, DB init & seeding
├── config.py               # Configuration (secret key, database URI)
├── extensions.py           # Shared Flask extensions (SQLAlchemy, LoginManager)
├── models.py                # User and Task models
├── auth/
│   └── routes.py            # /login, /logout
├── main/
│   └── routes.py            # / (dashboard page)
├── api/
│   └── routes.py            # /api/tasks REST endpoints
├── templates/
│   ├── base.html
│   ├── login.html
│   └── dashboard.html
├── static/
│   ├── css/style.css
│   └── js/main.js
├── instance/                # SQLite database file lives here (auto-created)
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── README.md
```

## Getting Started (Local)

1. **Create a virtual environment and install dependencies**

   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Run the application**

   ```bash
   python app.py
   ```

   The app will be available at `http://localhost:5000`.

3. **Log in**

   A default user is seeded automatically on first run:

   - **Username:** `admin`
   - **Password:** `admin123`

   Change this password (or remove the seed logic in `app.py`) before using this in any real deployment.

## Running with Docker

1. **Build the image**

   ```bash
   docker build -t task-manager .
   ```

2. **Run the container**

   ```bash
   docker run -d -p 5000:5000 --name task-manager \
     -e SECRET_KEY="change-this-secret" \
     -v task-manager-data:/app/instance \
     task-manager
   ```

   The `-v` flag persists the SQLite database in a named Docker volume so data survives container restarts.

3. Visit `http://localhost:5000`.

## Environment Variables

| Variable       | Description                                   | Default                              |
|----------------|------------------------------------------------|---------------------------------------|
| `SECRET_KEY`   | Flask session secret key                       | `dev-secret-key-change-in-production` |
| `DATABASE_URL` | SQLAlchemy database URI                        | `sqlite:///instance/tasks.db`         |

## REST API Reference

All task endpoints require an authenticated session (log in via `/login` first; the browser session cookie is used for authentication).

Base path: `/api`

| Method | Endpoint            | Description                                  |
|--------|----------------------|-----------------------------------------------|
| GET    | `/api/tasks`          | List current user's tasks. Supports `?q=` (search) and `?status=` (filter) query params. |
| GET    | `/api/tasks/<id>`     | Get a single task by ID.                      |
| POST   | `/api/tasks`          | Create a new task.                            |
| PUT    | `/api/tasks/<id>`     | Update an existing task (partial updates supported). |
| DELETE | `/api/tasks/<id>`     | Delete a task.                                |
| GET    | `/health`             | Health check endpoint (no auth required).     |

### Task JSON Shape

```json
{
  "id": 1,
  "title": "Write project proposal",
  "description": "Draft outline and share with team",
  "status": "In Progress",
  "created_at": "2026-07-01T12:00:00",
  "updated_at": "2026-07-02T09:30:00"
}
```

`status` must be one of: `Open`, `In Progress`, `Completed`.

### Example Requests

**Create a task**

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread", "status": "Open"}'
```

**Search tasks**

```bash
curl "http://localhost:5000/api/tasks?q=groceries" -b cookies.txt
```

**Filter by status**

```bash
curl "http://localhost:5000/api/tasks?status=Completed" -b cookies.txt
```

**Update a task's status**

```bash
curl -X PUT http://localhost:5000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status": "Completed"}'
```

**Delete a task**

```bash
curl -X DELETE http://localhost:5000/api/tasks/1 -b cookies.txt
```

**Health check**

```bash
curl http://localhost:5000/health
```
## Running Locally

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

python app.py
```

Application URL:

```
http://localhost:5000
```

Default credentials:

```
Username: admin
Password: admin123
```

---

## Running with Docker

Build the image:

```bash
docker build -t taskmanager .
```

Run the container:

```bash
docker run -d \
-p 5000:5000 \
--name taskmanager \
-e SECRET_KEY="change-this-secret" \
-v taskmanager-data:/app/instance \
taskmanager
```

Application URL:

```
http://localhost:5000
```

---

## Continuous Integration

Every push to the **main** branch automatically triggers a GitHub Actions workflow that:

- Builds the Docker image
- Starts the application container
- Verifies the `/health` endpoint
- Executes Playwright end-to-end tests
- Generates Allure test results
- Uploads the test report as a GitHub Actions artifact
- Cleans up the Docker container

---

## REST API

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/<id>` | Get task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/<id>` | Update task |
| DELETE | `/api/tasks/<id>` | Delete task |
| GET | `/health` | Health check |

---

## Environment Variables

| Variable | Default |
|----------|---------|
| `SECRET_KEY` | `dev-secret-key-change-in-production` |
| `DATABASE_URL` | `sqlite:///instance/tasks.db` |

---
## Notes

- The SQLite database file is created automatically at `instance/tasks.db` on first run.
- Tasks are scoped per-user — each user only sees and manages their own tasks.
- This project is intended as a learning/demo reference implementation. For production use, replace the default admin credentials, set a strong `SECRET_KEY`, and consider a production-grade database (e.g., PostgreSQL) via the `DATABASE_URL` environment variable.

# final flow
Developer
    |
    ↓
git push main
    |
    ↓
GitHub Actions
    |
    ├── Checkout code
    ├── Build Docker image
    ├── Start container
    ├── Run Playwright tests against the temporary container (Unit Tests)
    ├── Generate report
    ├── Destroys Container and Docker
    
    ↓
IF PASS
    |
    ↓
Render Deployment (Render Auto-Deploy feature listens: After CI Checks Pass) Auto deploy
    |
    ↓
DEV ENV (https://taskmanager-w3z7.onrender.com/)
    |
    ↓
Run Playwright pytest tests against the deployed app. (SMOKE TESTS)
    |
    ↓
QA_DEPLOY.yml (Deploy to QA Env(after smoke tests pass)) - Manual review and approval
    |
    ↓
QA Env
    |
    ↓
Run Full Regression (Triggered Manually)
   UI
   API
   Database
   Integration

# This is a cleaner separation:

GitHub Actions = CI
Render = Deployment/CD

## Future Enhancements

- Publish Docker image to a container registry
- Deploy to Kubernetes or a cloud platform
- Add CI/CD deployment environments (DEV → QA → STAGE)
- API automation integration