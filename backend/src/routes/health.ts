import { Hono } from "hono";
import { db } from "../db";

export const healthRouter = new Hono();

healthRouter.get("/", async (c) => {
  const checks: Record<string, string> = {};

  try {
    db.run("SELECT 1");
    checks.database = "connected";
  } catch {
    checks.database = "disconnected";
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
        { method: "GET", signal: AbortSignal.timeout(5000) }
      );
      checks.gemini = res.ok ? "available" : "error";
    } catch {
      checks.gemini = "unreachable";
    }
  } else {
    checks.gemini = "not_configured";
  }

  const status = checks.database === "connected" ? "ok" : "degraded";

  return c.json({
    status,
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks,
    env: {
      node: process.version,
      platform: process.platform,
      memory: process.memoryUsage().rss,
    },
  });
});
