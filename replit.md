# CutmanAI

## Overview

AI-powered boxing scouting report application for coaches and fighters. Upload a fight video or paste a YouTube link, the app uses TwelveLabs for video analysis and Claude AI to generate a structured professional scouting report.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/cutman-ai)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session + connect-pg-simple + bcrypt)
- **File uploads**: Multer (mp4/mov/avi up to 500MB, stored in /tmp)
- **Video analysis**: TwelveLabs API v1.3 (Marengo + Pegasus engines)
- **Report generation**: Claude API (claude-sonnet-4-5)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
cutman-ai/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080 → /api)
│   │   └── src/
│   │       ├── routes/     # auth, upload, analyze, reports, health
│   │       ├── services/   # twelvelabs.ts, claude.ts
│   │       └── middlewares/# auth.ts (requireAuth)
│   └── cutman-ai/          # React + Vite frontend (root /)
│       └── src/
│           ├── pages/      # Landing, Login, Register, Dashboard, NewReport, ReportProcessing, ReportView
│           ├── components/ # Navbar, ProtectedRoute, UI components
│           └── index.css   # Dark boxing theme (blood red accent)
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts    # users table
│           └── reports.ts  # reports table
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

## Environment Variables Required

- `TWELVELABS_API_KEY` — TwelveLabs video analysis API key
- `ANTHROPIC_API_KEY` — Anthropic Claude API key
- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `SESSION_SECRET` — Express session secret

## Database Schema

### users
- id (serial PK), email (unique), password_hash, created_at

### reports
- id (serial PK), user_id (FK → users), fighter_name, video_source, status (pending/processing/complete/error), raw_twelvelabs_analysis, report_content (Claude JSON), error_message, created_at

### session
- Auto-created by connect-pg-simple for session persistence

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register user |
| POST | /api/auth/login | — | Login |
| POST | /api/auth/logout | ✓ | Logout |
| GET | /api/auth/me | — | Get current user |
| POST | /api/upload | ✓ | Upload video file or YouTube URL |
| POST | /api/analyze/:reportId | ✓ | Start analysis pipeline (async) |
| GET | /api/reports | ✓ | List user's reports |
| GET | /api/reports/:id | ✓ | Get full report |
| DELETE | /api/reports/:id | ✓ | Delete report |
| PATCH | /api/reports/:id/name | ✓ | Update fighter name |
| GET | /api/reports/:id/status | ✓ | Poll analysis status |

## Frontend Routes

- `/` — Landing page (public)
- `/login` — Login (public)
- `/register` — Register (public)
- `/dashboard` — Dashboard with report list (protected)
- `/new` — New report creation (protected)
- `/reports/:id/processing` — Analysis in progress, polls status (protected)
- `/reports/:id` — Full report view (protected)

## Analysis Pipeline

1. POST /api/upload → creates report (status: pending), returns report ID immediately
2. POST /api/analyze/:id → fires off background pipeline, returns immediately:
   - Get or create TwelveLabs index per user
   - Upload video file (multipart) or YouTube URL
   - Poll TwelveLabs task until status = "ready" (up to 20 min)
   - Call TwelveLabs `/generate` (Pegasus summary) + `/search` (Marengo)
   - Send analysis to Claude claude-sonnet-4-5 → structured JSON scouting report
   - Update report status to "complete" or "error"
3. Frontend polls GET /api/reports/:id/status every 4 seconds

## Scouting Report Fields (from Claude)

- fighter_style_profile
- punch_tendencies
- defensive_habits
- behavior_under_pressure
- ring_movement_patterns
- setup_patterns
- body_shot_usage
- aggression_patterns
- defensive_weaknesses
- recommended_gameplan

## Development

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/cutman-ai run dev

# Push DB schema
pnpm --filter @workspace/db run push

# Run codegen (after changing OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen
```
