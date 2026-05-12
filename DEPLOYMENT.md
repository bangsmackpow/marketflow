# MarketFlow Deployment Guide

## GitHub Secrets (CI/CD only)

Add these to `Settings > Secrets and variables > Actions`:

| Secret | Description | Required |
|--------|-------------|----------|
| `GHCR_TOKEN` | GitHub PAT with `write:packages` scope. Generate at `Settings > Developer settings > Personal access tokens > Fine-grained tokens`. Minimum scopes: `repo`, `write:packages`. | Yes |
| `PORTAINER_WEBHOOK_URL` | Full webhook URL from your Portainer stack. Found in Portainer under the stack's "Webhook" section. Example: `https://portainer.example.com/api/webhooks/h123abc` | Yes |

## Portainer Stack Environment Variables

These go into Portainer's **Environment variables** section when creating the stack.

### Required

| Variable | Description |
|----------|-------------|
| `BETTER_AUTH_SECRET` | Random 32+ char string. Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Set to `https://marketflow.builtnetworks.com` |

### Admin Seed (first-run only)

Set these on the **first deploy** only. The seed runs once, then skips on subsequent starts.

| Variable | Example | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | `curtis@builtnetworks.com` | Admin email for auto-seed |
| `ADMIN_PASSWORD` | `your-password` | Admin password |
| `ADMIN_NAME` | `Admin` | Display name (optional) |
| `ADMIN_COMPANY` | `Built Networks` | Company name (optional) |
| `ADMIN_SLUG` | `built-networks` | URL slug (optional) |

### Optional

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key. Get at https://aistudio.google.com/app/apikey |
| `ADMIN_EMAILS` | Comma-separated emails for admin portal access, e.g. `curtis@builtnetworks.com` |
| `GA4_CLIENT_ID` | Google Analytics 4 OAuth client ID |
| `GA4_CLIENT_SECRET` | Google Analytics 4 OAuth client secret |
| `GA4_PROPERTY_ID` | Google Analytics 4 property ID |

The `DATABASE_URL` can be left as default (`/app/data/marketflow.db`). The database auto-creates on startup.

## Portainer Stack Setup

1. **Stacks > Add stack**
2. **Name**: `marketflow`
3. **Method**: Webhook editor
4. Paste the contents of `docker/docker-compose.prod.yml`
5. **Environment variables**: Add all vars from the tables above
6. **Deploy the stack**
7. After deployment, copy the **Webhook URL** and add as `PORTAINER_WEBHOOK_URL` in GitHub Secrets

## CI/CD Flow

```
git push origin main
  → GitHub Actions builds multi-stage image
  → Pushes to ghcr.io/bangsmackpow/marketflow:latest
  → Curls Portainer webhook URL
  → Portainer pulls ghcr.io/bangsmackpow/marketflow:latest
  → Portainer restarts stack container
  → App live at https://marketflow.builtnetworks.com
```

## Verifying a Deployment

After a push to `main`:

1. Check the Actions run at `https://github.com/bangsmackpow/marketflow/actions`
2. Confirm the image was pushed: `https://github.com/bangsmackpow/marketflow/pkgs/container/marketflow`
3. Watch Portainer logs for the stack redeploy
4. Visit `https://marketflow.builtnetworks.com/api/v1/health` — should return `{"status":"ok","database":"connected","checks":{"gemini":"available"}}`
5. Sign in at `https://marketflow.builtnetworks.com/login`

## Rollback

If a deployment fails:

1. In Portainer, go to **Stacks > marketflow > Stop**
2. Edit the stack, change `image: ghcr.io/bangsmackpow/marketflow:latest` to a specific SHA tag (e.g., `:sha-abc1234`)
3. Redeploy
4. Or pull a previous image manually and re-tag as `latest`

## Troubleshooting

### User already exists on seed

The seed script checks for existing users by email. If the admin already exists from a manual registration, the seed skips. To force re-seed, delete the user from the database or use a different `ADMIN_EMAIL`.

### Container exits on startup

Check `docker logs marketflow` for:
- `BETTER_AUTH_SECRET:?error` — env var not set
- `Environment validation failed` — missing required vars
- Database migration errors — volume may have old schema; migration handles `ALTER TABLE` automatically

### Login returns 401

- Ensure the user has a company (run the onboarding wizard)
- Ensure `ActiveOrganizationId` is set on the session (wizard sets it automatically)
- API routes without `X-Company-Id` will return 401 for tenant-scoped endpoints
