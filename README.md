# Aim — Goal-Driven Nutrition App

A nutrition app where your goal is the organizing unit. Pick a life goal, get an evidence-backed meal plan, and track real biological progress — not streaks.

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Swagger
- **Database:** PostgreSQL
- **AI:** Google Gemini (meal composition + nudge copy only — targets are computed deterministically)

## Goals supported
| Goal | Evidence tier | Timeline |
|------|--------------|----------|
| Build Muscle | Strong | 12 weeks |
| Gut Health | Moderate | 10 weeks |
| Clear Skin | Mixed | 12 weeks |
| Fat Loss | Strong | 12 weeks |
| Energy & Focus | Emerging | 6 weeks |

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL and GEMINI_API_KEY
npm install
npm run dev            # runs on port 4000
```

API docs: http://localhost:4000/api-docs

### Frontend
```bash
cd frontend
npm install
npm run dev            # runs on port 5173
```

### Database
Requires PostgreSQL. The schema auto-runs on server start.

```bash
createdb aim_db
# then set DATABASE_URL=postgresql://user:pass@localhost:5432/aim_db in backend/.env
```

## Architecture

The app is a goal-agnostic engine + pluggable protocol modules.

```
Intake → Goal selection → Protocol module → Meal plan → Nudge layer → Tracking vs baseline
```

- **Deterministic (rules engine):** all targets, timelines, endpoint definitions
- **AI (Gemini):** meal composition within food policy, nudge copy — never originates numbers
