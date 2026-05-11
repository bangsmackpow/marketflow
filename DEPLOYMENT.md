# MarketFlow Deployment Guide

## GitHub Secrets (CI/CD only)

Add these to `Settings > Secrets and variables > Actions` — these are used only
by the GitHub Actions pipeline, never by the running container:

| Secret | Description | Required |
|--------|-------------|----------|
| `GHCR_TOKEN` | GitHub PAT with `write:packages` scope. Generate at `Settings > Developer settings > Personal access tokens > Fine-grained tokens`. Minimum scopes: `repo`, `write:packages`. | Yes |
| `PORTAINER_WEBHOOK_URL` | Full webhook URL from your Portainer stack. Found in Portainer under the stack's "Webhook" section. Example: `https://portainer.example.com/api/webhooks/h123abc` | Yes |

## Portainer Stack Environment Variables (runtime)

These go into Portainer's **Environment variables** section when creating the
stack. The `docker-compose.prod.yml` uses `${VAR:?error}` syntax, so Portainer
will prompt you for any missing required values.

| Variable | Description | Required |
|----------|-------------|----------|
| `BETTER_AUTH_SECRET` | Random 32+ char string for auth token encryption. Generate: `openssl rand -base64 32` | Yes |
| `BETTER_AUTH_URL` | Public URL of the app. Set to `https://marketflow.builtnetworks.com` | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI generation. Get at https://aistudio.google.com/app/apikey | No |
| `ADMIN_EMAILS` | Comma-separated emails with admin access, e.g. `curtis@builtnetworks.com` | No |
| `GA4_CLIENT_ID` | Google Analytics 4 OAuth client ID | No |
| `GA4_CLIENT_SECRET` | Google Analytics 4 OAuth client secret | No |
| `GA4_PROPERTY_ID` | Google Analytics 4 property ID | No |

The `DATABASE_URL` variable can be left at its default (`/app/data/marketflow.db`)
since the database lives in the Docker volume.

## Portainer Stack Setup

1. In Portainer, go to **Stacks > Add stack**.
2. **Name**: `marketflow`
3. **Method**: Select **Webhook editor**.
4. Paste the contents of `docker/docker-compose.prod.yml` into the editor.
5. Scroll down to **Environment variables** and add all the runtime vars from
   the table above.
6. Click **Deploy the stack**.
7. After deployment, go to the stack's detail page and copy the **Webhook URL**.
   Add this as `PORTAINER_WEBHOOK_URL` in GitHub Secrets.

## CI/CD Flow

```
git push origin main
  → GitHub Actions builds image
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
3. Watch Portainer logs for the stack redeploy.
4. Visit `https://marketflow.builtnetworks.com/api/v1/health` — should return `{"status":"ok","database":"connected"}`
5. Sign up at `https://marketflow.builtnetworks.com/register`

## Rollback

If a deployment fails:

1. In Portainer, go to the stack and **Stop** it.
2. Edit the stack, change `image: ghcr.io/bangsmackpow/marketflow:latest` to a
   specific SHA tag (e.g., `:sha-abc1234`), and redeploy.
3. Or pull a previous image manually and re-tag as `latest`.
