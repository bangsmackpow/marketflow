# MarketFlow

A structured marketing implementation engine that transforms abstract marketing skills from the [marketingskills](https://github.com/coreyhaines31/marketingskills) repository into executable, wizard-driven workflows for small and medium businesses.

Built for [Built Networks](https://builtnetworks.com).  
Live at [marketflow.builtnetworks.com](https://marketflow.builtnetworks.com).

## Overview

MarketFlow ingests 41 marketing skill frameworks and turns them into an interactive dashboard where business owners can select their marketing level, complete guided tasks, generate AI-powered marketing assets, and track their marketing maturity with a visual completeness score.

### Core Concepts

- **Wizard-Style Dashboard** — Users select a marketing level (Basic/Pro/Advanced) and work through structured checklists derived from proven marketing frameworks.
- **AI Asset Generation** — Gemini 2.0 Flash-powered generation of Google Business descriptions, SEO audits, ad copy, and more based on the company's product context.
- **Completeness Score** — A circular 0-100 SVG meter showing how much of the business's marketing foundation is complete.
- **Context Slider** — A UI toggle allowing non-technical users to see guided forms while technical users view the underlying markdown logic.
- **Industry-Driven UI** — 198 industries mapped to 20 sector-specific design profiles (colors, typography, border radius, density) applied instantly as CSS variables.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 3, Vite 6 |
| Backend | Hono 4 (Node.js), better-sqlite3, Drizzle ORM |
| Auth | better-auth (email/password, multi-tenant organization plugin) |
| AI | Google Gemini 2.0 Flash (direct API) |
| Icons | lucide-react (professional, high-contrast, no emoji) |
| Markdown | react-markdown, remark-gfm |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Logging | pino (structured JSON, tenant-scoped) |
| Container | Docker multi-stage, docker-compose |
| Registry | GitHub Container Registry (ghcr.io) |
| CI/CD | GitHub Actions → Portainer webhook redeploy |

## Architecture

```
marketflow/
├── backend/
│   └── src/
│       ├── auth/config.ts       # better-auth + organization plugin
│       ├── db/
│       │   ├── schema.ts        # Drizzle ORM schema (10 tables)
│       │   ├── index.ts         # SQLite connection (WAL mode)
│       │   ├── migrate.ts       # Auto-create tables on startup
│       │   └── seed.ts          # Admin user/company seed on first run
│       ├── lib/
│       │   ├── analytics/       # GA4 provider + adapter interface
│       │   ├── backup.ts        # Database backup script
│       │   └── env-validator.ts # Start-up environment checks
│       ├── middleware/
│       │   ├── tenant.ts        # X-Company-Id scoping
│       │   ├── rate-limit.ts    # 120 req/min API, 10 req/min AI
│       │   └── logger.ts        # Pino structured logging
│       ├── routes/
│       │   ├── health.ts        # Health check
│       │   ├── auth.ts          # Tenant switching
│       │   ├── skills.ts        # Skill listing/lookup
│       │   ├── tasks.ts         # Task CRUD + score
│       │   ├── companies.ts     # Company settings
│       │   ├── analytics.ts     # Marketing metrics
│       │   ├── generate.ts      # Gemini AI generation
│       │   └── admin.ts         # Admin portal
│       ├── skills/loader.ts     # Marketingskills ingestion
│       ├── app.ts               # Hono app assembly
│       └── index.ts             # Server entry point
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── ProjectBoard.tsx         # Kanban drag-and-drop
│       │   ├── admin/AdminDashboard.tsx  # Built Networks admin
│       │   └── onboarding/WelcomeWizard.tsx  # 3-step setup
│       ├── components/
│       │   ├── dashboard/       # CompletenessMeter, MarketingLevelSelector
│       │   ├── analytics/       # MetricsOverview, InsightBadge
│       │   ├── skills/          # SkillWorkbench (Context Slider)
│       │   ├── header/          # TenantSwitcher
│       │   ├── shared/          # ExportToolbar, Toast
│       │   └── layout/          # AppLayout
│       ├── lib/
│       │   ├── auth-client.ts   # better-auth client
│       │   ├── api.ts           # X-Company-Id API client
│       │   └── design-system.ts # 198-industry → CSS variables
│       └── stores/design-store.ts
├── docker/
│   ├── Dockerfile               # Multi-stage build (node:22-alpine)
│   ├── docker-compose.yml       # Dev compose
│   ├── docker-compose.prod.yml  # Production compose (Portainer)
│   ├── nginx-template.conf      # NPM advanced config
│   └── backup.sh                # Database backup script
├── shared/schemas/               # Zod schemas
├── .github/workflows/deploy.yml  # CI/CD pipeline
├── .env                          # Local development defaults
├── DEPLOYMENT.md                 # Production deployment guide
└── AGENTS.md                     # Agent memory (AI context)
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/health` | Health check (DB + Gemini status) | None |
| `GET` | `/api/v1/skills` | List all ingested marketing skills | Session |
| `GET` | `/api/v1/skills/:slug` | Get skill by slug | Session |
| `GET` | `/api/v1/skills/categories` | List unique skill categories | Session |
| `GET` | `/api/v1/tasks` | List user tasks (scoped to X-Company-Id) | Tenant |
| `PATCH` | `/api/v1/tasks/:id` | Update task status | Tenant |
| `POST` | `/api/v1/tasks/toggle` | Toggle task completion | Tenant |
| `GET` | `/api/v1/tasks/score` | Get completeness score | Tenant |
| `GET` | `/api/v1/companies/settings` | Get company profile | Tenant |
| `PATCH` | `/api/v1/companies/settings` | Update company industry/context | Tenant |
| `GET` | `/api/v1/analytics` | Get marketing metrics (mock or GA4) | Tenant |
| `POST` | `/api/v1/generate` | Generate AI marketing asset via Gemini | Tenant |
| `POST` | `/api/v1/auth/tenant-switch` | Switch active company | Session |
| `GET` | `/api/v1/admin/companies` | List all companies (admin) | Admin |
| `POST` | `/api/v1/admin/refresh-skills` | Re-ingest skills from GitHub | Admin |

Auth levels:
- **None**: No authentication required.
- **Session**: Valid session cookie required (logged in), no X-Company-Id needed.
- **Tenant**: Session + X-Company-Id header + membership check.
- **Admin**: Session + email in `ADMIN_EMAILS` env var.

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Local Development

```bash
# Clone and install
git clone https://github.com/bangsmackpow/marketflow.git
cd marketflow
npm install

# Set up environment
cp .env .env.local
# Edit .env.local as needed (BETTER_AUTH_SECRET must be set)

# Ingest 41 marketing skills from the marketingskills repo
npx tsx backend/src/skills/loader.ts

# Start dev servers (Vite + Hono concurrently)
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:3001
```

The database and tables are auto-created on first server start. No manual migration step needed.

### Admin Seed

Set these env vars to auto-create an admin user + company on first startup:

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
ADMIN_NAME=Admin
ADMIN_COMPANY=My Company
ADMIN_SLUG=my-company
```

On first start, the seed creates the user and a company. On subsequent starts it skips.

## Features by Phase

### Phase 1 — Scaffolding & Data Layer
- Multi-tenant auth with better-auth organization plugin
- SQLite database with Drizzle ORM (auto-migrated on startup)
- 41 marketing skills ingested from `coreyhaines31/marketingskills`
- X-Company-Id tenant isolation middleware (permissive — allows null tenant)
- Company onboarding wizard with 3-step flow

### Phase 2 — UI Framework & AI Engine
- 198-industry design system (20 sector profiles) applied as CSS variables
- Circular SVG completeness meter with color transitions
- Marketing Level selector (Basic/Pro/Advanced with point weighting)
- Context Slider toggle (simple forms vs react-markdown rendering)
- Gemini 2.0 Flash AI asset generation with system prompt construction

### Phase 3 — Analytics & Workflows
- GA4 provider with OAuth, token refresh, mock fallback
- Insight badges on skill cards driven by analytics context
- Export toolbar with clipboard copy + .txt/.md download
- Platform-specific formatters (GBP strip, SEO list, ad copy clean)
- Kanban project board with @dnd-kit drag-and-drop

### Phase 4 — Admin & Hardening
- Admin portal with searchable company table + completeness scores
- Rate limiting: 120 req/min API, 10 req/min AI generation
- Pino structured logging with X-Company-Id on every request
- Environment validation on startup (required vs optional vars)
- Database backup script with age-based cleanup
- 3-step onboarding wizard with industry-based level recommendations

### Phase 5 — CI/CD Pipeline
- GitHub Actions: Build → Push to ghcr.io → Portainer webhook
- Docker multi-stage production builds (non-root user, WAL mode)
- Nginx Proxy Manager configuration template
- Admin user/company seed on first deploy

## Database Schema

**10 tables:**

| Table | Purpose | Managed by |
|-------|---------|------------|
| `user` | Auth users | better-auth |
| `session` | Auth sessions (includes token, active_organization_id) | better-auth |
| `account` | OAuth accounts + password storage | better-auth |
| `verification` | Email verification codes | better-auth |
| `organization` | Multi-tenant organizations | better-auth |
| `member` | Organization membership with roles | better-auth |
| `invitation` | Org invitation tracking | better-auth |
| `companies` | App-level company profiles with product_context | MarketFlow |
| `marketing_skills` | 41 ingested skill frameworks with raw markdown | MarketFlow |
| `user_tasks` | Per-user/company task progress with ai_output JSON | MarketFlow |

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `./data/marketflow.db` | No | SQLite database path |
| `BETTER_AUTH_SECRET` | — | **Yes** | Auth token encryption key |
| `BETTER_AUTH_URL` | `http://localhost:3001` | **Yes** | Public URL for auth callbacks |
| `PORT` | `3001` | No | HTTP server port |
| `NODE_ENV` | `development` | No | Runtime mode |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | No | Pino log level |
| `GEMINI_API_KEY` | — | No | Google Gemini API key |
| `GA4_CLIENT_ID` | — | No | Google Analytics OAuth client ID |
| `GA4_CLIENT_SECRET` | — | No | Google Analytics OAuth client secret |
| `GA4_PROPERTY_ID` | — | No | Google Analytics property ID |
| `ADMIN_EMAILS` | — | No | Comma-separated admin portal access |
| `ADMIN_EMAIL` | — | No | Seed admin email (first-run only) |
| `ADMIN_PASSWORD` | — | No | Seed admin password |
| `ADMIN_NAME` | `Admin` | No | Seed admin display name |
| `ADMIN_COMPANY` | `Built Networks` | No | Seed company name |
| `ADMIN_SLUG` | `built-networks` | No | Seed company slug |
| `BACKUP_DIR` | `./data/backups` | No | Database backup directory |

## Troubleshooting

### 401 on API calls after login

The `X-Company-Id` header is required for tenant-scoped routes. If missing:
- Check that the session has `activeOrganizationId` set
- Run the onboarding wizard to create/select a company
- Or call `POST /api/v1/auth/tenant-switch` with a valid company ID

### Registration returns 500

Possible causes:
- Missing `BETTER_AUTH_SECRET` env var
- Session table missing `token` column (run migrations)
- Database volume from old schema (migration handles this with `ALTER TABLE`)

### Container exits immediately

Check the startup logs:
- `BETTER_AUTH_SECRET:?error` not set → container won't start
- `BETTER_AUTH_URL` not set → auth callbacks will fail
- Run `docker logs marketflow` to see env validation errors

## License

MIT — see [LICENSE](LICENSE) for details.
