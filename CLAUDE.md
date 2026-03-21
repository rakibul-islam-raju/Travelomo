# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Travelomo is a full-stack event/travel management platform with three components:

- **backend/** — Django 5.1 REST API (DRF + SimpleJWT auth, Celery + Redis for async tasks, PostgreSQL)
- **frontend/** — Next.js 15 (React 19, TypeScript, Tailwind CSS, Tanstack Query, Zustand, shadcn/ui via Radix primitives)
- **admin/** — Vite + React 18 admin panel (Ant Design, Redux Toolkit with RTK Query, React Router, Sass)

## Commands

### Development (Docker)
```bash
docker-compose up --build        # Start all services
docker-compose up --build api    # Start only the API
docker-compose down              # Stop all services
```

### Frontend (Next.js) — runs on port 3000
```bash
cd frontend && npm run dev       # Dev server with Turbopack
cd frontend && npm run build     # Production build
cd frontend && npm run lint      # ESLint
```

### Admin Panel (Vite) — runs on port 5173
```bash
cd admin && yarn dev             # Dev server
cd admin && yarn build           # Production build
cd admin && yarn lint            # ESLint
cd admin && yarn test            # Run tests (vitest)
cd admin && yarn vitest run src/__test__/specific.test.jsx  # Single test
cd admin && yarn test:watch      # Watch mode
```

### Backend (Django) — runs on port 8000
```bash
cd backend && python manage.py runserver
cd backend && python manage.py migrate
cd backend && python manage.py test                    # All tests
cd backend && python manage.py test event.tests        # Single app tests
cd backend && python manage.py create_admin            # Seed admin user
```

## Architecture

### Backend
- **Django project:** `core/` (settings, urls, celery config)
- **Django apps:** `user`, `authentication`, `vendor`, `event`, `stats`, `notification`
- **API prefix:** `/api/v1/` — auth at `/api/v1/auth/`, stats at `/api/v1/stats/`
- **Swagger:** served at root URL via drf-spectacular
- **Celery:** configured in `core/eventcelery.py`, used for email notifications (`notification/tasks.py`, `event/tasks.py`)
- **Custom user model:** `user/models.py` with custom manager in `user/managers.py`
- **Environment:** uses `django-environ`, reads from `backend/.env`

### Frontend
- **App Router** with route groups: `(client)` for public pages, `dashboard` for authenticated views
- **Auth routes:** `(client)/(auth)/` — login, registration, vendor-registration, forget-password, activate-account
- **Event pages:** `(client)/events/` with dynamic `[eventId]` route
- **State:** Zustand for client state, Tanstack Query for server state
- **Auth:** NextAuth (next-auth v4)
- **Forms:** react-hook-form + zod validation
- **Env file:** `frontend/.env.local`

### Admin Panel
- **Redux store:** `src/redux/store.js` with slices for auth, event, user, vendor, dashboard, common
- **API layer:** RTK Query via `src/redux/baseApi.js`
- **Routing:** `src/routes/index.jsx` with React Router v6
- **Pages:** `src/pages/` — auth, dashboard, event, user, vendor
- **Tests:** `src/__test__/` using vitest + @testing-library/react

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys on push to `main`: SSHes into VPS, pulls code, rebuilds Docker containers.

### Docker ports
- PostgreSQL: 5433 (host) → 5432 (container)
- API: 8282 → 8000
- Frontend: 8181 → 3000
- Admin: 8383 → 5173
