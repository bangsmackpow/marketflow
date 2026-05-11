import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { GA4Provider } from "../lib/analytics/ga4";
import { AnalyticsProvider, DEFAULT_METRICS } from "../lib/analytics";

const providers: AnalyticsProvider[] = [new GA4Provider()];

export const analyticsRouter = new Hono();

analyticsRouter.get("/", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const company = await db
    .select()
    .from(schema.company)
    .where(eq(schema.company.id, tenant.companyId))
    .get();

  if (!company) return c.json({ error: "Company not found" }, 404);

  const tokens = (company.analyticsTokens as Record<string, string>) || {};
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const results: Record<string, any> = {};

  for (const provider of providers) {
    if (provider.isConnected(tokens)) {
      try {
        const accessToken = tokens[`${provider.key}_access_token`] || "";
        results[provider.key] = await provider.getMetrics(accessToken, thirtyDaysAgo, now);
      } catch {
        results[provider.key] = { ...DEFAULT_METRICS, error: "Failed to fetch" };
      }
    }
  }

  const primary = results.ga4 || DEFAULT_METRICS;

  return c.json({
    metrics: primary,
    providers: providers.map((p) => ({
      key: p.key,
      name: p.name,
      connected: p.isConnected(tokens),
    })),
  });
});
