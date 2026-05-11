# MarketFlow Deployment Guide

## GitHub Secrets

Add the following secrets to your GitHub repository at
`Settings > Secrets and variables > Actions > New repository secret`:

| Secret | Description | Required |
|--------|-------------|----------|
| `GHCR_TOKEN` | GitHub Personal Access Token with `write:packages` scope. Generate at `Settings > Developer settings > Personal access tokens > Fine-grained tokens`. | Yes |
| `PORTAINER_WEBHOOK_URL` | Full webhook URL from your Portainer stack. Found in Portainer under the stack's "Webhook" section. Example: `https://portainer.example.com/api/webhooks/abc123` | Yes |
| `BETTER_AUTH_SECRET` | Random 32+ character string for auth token encryption. Generate with: `openssl rand -base64 32` | Yes |
| `BETTER_AUTH_URL` | Public URL of the app. Set to `https://marketflow.builtnetworks.com` | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for AI content generation. Get one at https://aistudio.google.com/app/apikey | No |
| `GA4_CLIENT_ID` | Google Analytics 4 OAuth client ID | No |
| `GA4_CLIENT_SECRET` | Google Analytics 4 OAuth client secret | No |
| `GA4_PROPERTY_ID` | Google Analytics 4 property ID | No |
| `ADMIN_EMAILS` | Comma-separated email addresses with admin portal access (e.g., `admin@builtnetworks.com,curtis@builtnetworks.com`) | No |

## One-Time Portainer Setup

1. In Portainer, go to **Stacks > Add stack**.
2. Name: `marketflow`
3. Method: **Webhook** or **Git** (paste the `docker-compose.prod.yml` contents).
4. If using Webhook method: paste the YAML from `docker/docker-compose.prod.yml`.
5. Set the **Environment variables** in Portainer matching the secrets above.
6. Deploy the stack.
7. Copy the **Webhook URL** from the stack's detail page and add it as `PORTAINER_WEBHOOK_URL` in GitHub secrets.

## Nginx Proxy Manager Setup

1. In NPM, create a new **Proxy Host**.
2. **Domain**: `marketflow.builtnetworks.com`
3. **Scheme**: `http`
4. **Forward IP**: The IP or hostname of the Docker host running Portainer.
5. **Forward Port**: `3000`
6. **SSL**: Request a new SSL certificate via Let's Encrypt.
7. **Advanced tab**: Paste the contents of `docker/nginx-template.conf`.

## CI/CD Flow

```
Push to main
  → GitHub Actions builds image
  → Pushes to ghcr.io/bangsmackpow/marketflow:latest
  → Curls Portainer webhook
  → Portainer pulls new image
  → Portainer restarts container
  → App accessible at https://marketflow.builtnetworks.com
```

## Verifying a Deployment

After a push to `main`:

1. Check the GitHub Actions run at `https://github.com/bangsmackpow/marketflow/actions`
2. Confirm the image was pushed: `https://github.com/bangsmackpow/marketflow/pkgs/container/marketflow`
3. Check Portainer logs for the stack redeploy
4. Visit `https://marketflow.builtnetworks.com/api/v1/health` — should return `{"status":"ok"}`
5. Sign up at `https://marketflow.builtnetworks.com/register`

## Rollback

If a deployment fails:

1. In Portainer, go to the stack and **Stop** it.
2. Pull a previous image tag manually: `docker pull ghcr.io/bangsmackpow/marketflow:sha-<COMMIT>`
3. Edit the stack, change the image tag, and redeploy.
4. Or use Portainer's built-in rollback if available.
