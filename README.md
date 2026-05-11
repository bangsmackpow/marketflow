# MarketFlow

A structured marketing implementation engine that transforms abstract marketing skills from the [marketingskills](https://github.com/coreyhaines31/marketingskills) repository into executable, wizard-driven workflows for small and medium businesses.

## Overview

MarketFlow turns 41 marketing skill frameworks into an interactive dashboard where business owners can select their marketing level, complete guided tasks, generate AI-powered marketing assets, and track their marketing maturity with a visual completeness score.

### Core Concepts

- **Wizard-Style Dashboard** — Users select a marketing level (Basic/Pro/Advanced) and work through structured checklists derived from proven marketing frameworks.
- **AI Asset Generation** — Gemini-powered generation of Google Business descriptions, SEO audits, ad copy, and more based on the company's product context.
- **Completeness Score** — A 0-100 visual meter showing how much of the business's marketing foundation is complete.
- **Context Slider** — A UI toggle allowing non-technical users to see guided forms while technical users view the underlying markdown logic.
- **Industry-Driven UI** — 161 industry-specific design profiles (colors, typography, border radius) that apply instantly based on the company's industry selection.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 3, Vite 6 |
| Backend | Hono 4, better-sqlite3, Drizzle ORM |
| Auth | better-auth (email/password, multi-tenant) |
| AI | Google Gemini 2.0 Flash |
| Icons | lucide-react |
| Markdown | react-markdown, remark-gfm |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Logging | pino |
| Container | Docker, docker-compose |
| Registry | GitHub Container Registry (ghcr.io) |
| CI/CD | GitHub Actions → Portainer webhook |

## Architecture

```
marketflow/
├── backend/              # Hono API server
│   └── src/
│       ├── auth/         # better-auth config + org plugin
│       ├── db/           # Drizzle schema + SQLite connection
│       ├── lib/          # Analytics providers, backup, env validation
│       ├── middleware/    # Tenant isolation, rate limiting, logging
│       ├── routes/       # REST API endpoints
│       └── skills/       # Skill ingestion pipeline
├── frontend/             # React SPA
│   └── src/
│       ├── components/   # UI components by domain
│       ├── pages/        # Route pages
│       ├── lib/          # API client, auth client, design system
│       └── stores/       # React Query hooks
├── docker/               # Dockerfile + compose files
└── shared/               # Zod schemas for cross-boundary types
```

## API Routes

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/health` | Health check with DB + Gemini status | None |
| `GET` | `/api/v1/skills` | List all ingested marketing skills | Tenant |
| `GET` | `/api/v1/skills/:slug` | Get skill by slug | Tenant |
| `GET` | `/api/v1/skills/categories` | List skill categories | Tenant |
| `GET` | `/api/v1/tasks` | List user tasks for current company | Tenant |
| `PATCH` | `/api/v1/tasks/:id` | Update task status (pending/in_progress/complete) | Tenant |
| `POST` | `/api/v1/tasks/toggle` | Toggle task completion | Tenant |
| `GET` | `/api/v1/tasks/score` | Get completeness score | Tenant |
| `GET` | `/api/v1/companies/settings` | Get company profile + settings | Tenant |
| `PATCH` | `/api/v1/companies/settings` | Update company settings | Tenant |
| `GET` | `/api/v1/analytics` | Get marketing metrics (mock or GA4) | Tenant |
| `POST` | `/api/v1/generate` | Generate AI marketing asset via Gemini | Tenant |
| `POST` | `/api/v1/auth/tenant-switch` | Switch active company context | Session |
| `GET` | `/api/v1/admin/companies` | List all companies (admin only) | Admin |
| `POST` | `/api/v1/admin/refresh-skills` | Re-ingest skills from GitHub (admin only) | Admin |

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/bangsmackpow/marketflow.git
cd marketflow

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env .env.local
# Edit .env.local with your values

# 4. Push the database schema
mkdir -p data
npx drizzle-kit push

# 5. Ingest the 41 marketing skills
npx tsx backend/src/skills/loader.ts

# 6. Start development servers
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:3001
```

### Docker (Production-like)

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Deploying to Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full production setup guide covering:

- GitHub Container Registry setup
- Portainer stack configuration
- Nginx Proxy Manager setup
- GitHub Actions CI/CD pipeline
- Environment variable management

## Features by Phase

### Phase 1 — Scaffolding & Data Layer
- Multi-tenant auth with better-auth organization plugin
- SQLite database with Drizzle ORM
- 41 marketing skills ingested from marketingskills repo
- X-Company-Id tenant isolation middleware
- Company onboarding flow

### Phase 2 — UI Framework & AI Engine
- 161-industry design system with CSS variables
- Circular SVG completeness meter
- Marketing Level selector (Basic/Pro/Advanced)
- Context Slider toggle (simple form vs raw markdown)
- Gemini AI asset generation endpoint

### Phase 3 — Analytics & Workflows
- GA4 analytics provider with mock fallback
- Insight badges on skill cards based on metrics
- Export toolbar with copy/download/platform formatters
- Kanban-style project board with drag-and-drop

### Phase 4 — Admin & Hardening
- Admin portal with searchable company table
- Rate limiting (120 req/min API, 10 req/min AI)
- Pino structured logging with tenant context
- Environment validation on startup
- Database backup script
- 3-step onboarding wizard with level recommendations

### Phase 5 — CI/CD Pipeline
- GitHub Actions build + push to GHCR
- Portainer webhook auto-redeploy
- Docker multi-stage production builds
- Nginx Proxy Manager configuration

## Database Schema

```
user                 — Auth users (better-auth)
session              — Auth sessions (better-auth)
account              — OAuth accounts (better-auth)
verification         — Email verification (better-auth)
organization         — Multi-tenant orgs (better-auth)
member               — Org members (better-auth)
invitation           — Org invitations (better-auth)
companies            — Company profiles with product_context + analytics_tokens
marketing_skills     — 41 ingested marketing skills with raw markdown
user_tasks           — Per-user, per-company task progress with ai_output
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `./data/marketflow.db` | SQLite database path |
| `BETTER_AUTH_SECRET` | — | Auth token encryption key |
| `BETTER_AUTH_URL` | `http://localhost:3001` | Public URL for auth callbacks |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `GA4_CLIENT_ID` | — | Google Analytics OAuth client ID |
| `GA4_CLIENT_SECRET` | — | Google Analytics OAuth client secret |
| `GA4_PROPERTY_ID` | — | Google Analytics property ID |
| `ADMIN_EMAILS` | — | Comma-separated admin email addresses |
| `PORT` | `3001` | HTTP server port |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Pino log level |
| `BACKUP_DIR` | `./data/backups` | Database backup directory |

## License

MIT
