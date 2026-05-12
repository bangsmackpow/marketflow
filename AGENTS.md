# MarketFlow — Agent Memory

## Project Identity

- **Name**: MarketFlow
- **Owner**: Built Networks (@bangsmackpow)
- **Domain**: marketflow.builtnetworks.com
- **Repository**: github.com/bangsmackpow/marketflow
- **Container Registry**: ghcr.io/bangsmackpow/marketflow
- **CI/CD**: GitHub Actions → Portainer Stack Redeploy

## Architecture Overview

Monorepo with three top-level directories:

- **`backend/`** — Hono 4 API server (Node.js ESM)
- **`frontend/`** — React 19 SPA (Vite + Tailwind)
- **`docker/`** — Dockerfile + compose files
- **`shared/`** — Zod schemas (not currently imported by frontend/backend directly)

## Key Technical Decisions

### ESM and TypeScript
- `package.json` has `"type": "module"`
- All relative imports in `backend/src/` use explicit `.js` extensions (e.g., `from "./app.js"`)
- Backend tsconfig uses `"rootDir": "src"`, `"outDir": "dist"`, `"composite": true`
- Build command: `tsc --build backend/tsconfig.json` (not `-p` flag, since `composite` requires `--build`)

### Database
- SQLite via better-sqlite3 with WAL mode
- Tables auto-created on startup via `backend/src/db/migrate.ts` (raw SQL)
- The migrate script includes `ALTER TABLE` migrations for schema upgrades
- Session table requires: id, token (unique), user_id, expires_at, active_organization_id
- Stale `tsconfig.tsbuildinfo` files should NOT be committed (gitignored as `*.tsbuildinfo`)

### Authentication
- better-auth with email/password + organization plugin
- Auth routes mounted at BOTH `/api/auth/*` and `/api/v1/auth/*` (the client defaults to `/api/auth`)
- CORS configured for both paths
- `crossSubDomainCookies` enabled (SameSite=None, Secure=true for HTTPS)

### Multi-Tenancy
- Organizations managed by better-auth's organization plugin
- Tables: `organization`, `member`, `invitation` (better-auth)
- `companies` table mirrors organizations with app-level data (product_context, analytics_tokens)
- `X-Company-Id` header maps to organization UUID
- TenantGuard middleware is **permissive**: sets `tenant` to null if header missing (doesn't block)
- Routes check for `c.get("tenant")` and return errors if null

### Docker
- Multi-stage build: base → deps (prod) → build-deps → build → runner
- Runner: node:22-alpine, non-root user (`appuser`), `/app/data` volume
- `docker-compose.prod.yml` uses `image: ghcr.io/bangsmackpow/marketflow:latest` (pre-built)
- `docker-compose.yml` (root) uses `build: .` (local dev)
- Healthcheck: `curl /api/v1/health` every 30s

### CI/CD Pipeline
- On push to `main`: Build → Push to GHCR → Portainer webhook
- Image tags: `latest` + `sha-<short>`
- Cache: `type=gha` for Docker layer caching
- Deploy job is conditional (skips if `PORTAINER_WEBHOOK_URL` not set)

## Common Fixes

### MODULE_NOT_FOUND / Cannot find module
1. Check if import has `.js` extension in `backend/src/` files
2. Check if `tsc --build` was used (not `-p`)
3. Check if `tsconfig.tsbuildinfo` is stale — delete and rebuild
4. Check Dockerfile COPY paths match `outDir`

### 404 on registration
1. Check if `/api/auth/*` route is registered in app.ts
2. better-auth client defaults to `/api/auth/` path

### 500 on registration
1. Check if `token` column exists in session table
2. Check `BETTER_AUTH_SECRET` is set
3. Check `CREATE TABLE` migration ran

### 401 on API calls
1. Check if `X-Company-Id` header is being sent
2. Check if `activeOrganizationId` is set in session
3. Check TenantGuard middleware isn't blocking (should be permissive)

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `BETTER_AUTH_SECRET` | Yes | Auth encryption |
| `BETTER_AUTH_URL` | Yes | Auth callbacks |
| `GEMINI_API_KEY` | No | AI generation |
| `ADMIN_EMAILS` | No | Admin access |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | No | First-run seed |
| `GA4_*` | No | Analytics |

## Style Guide

- No emoji icons — use lucide-react
- Colors via CSS variables (`--clr-primary`, `--clr-muted`, etc.)
- Professional typography: Inter (body), JetBrains Mono (code)
- Tailwind for styling, custom `btn`, `input`, `card`, `label` component classes
- All state management via React Query (no Zustand/Redux)
- Forms use uncontrolled or local state
- All code TypeScript

## Related Repositories

- **Source data**: https://github.com/coreyhaines31/marketingskills
