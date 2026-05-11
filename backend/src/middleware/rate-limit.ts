import { createMiddleware } from "hono/factory";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, CLEANUP_INTERVAL);

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  label: string;
}

export function rateLimit(opts: RateLimitOptions) {
  return createMiddleware(async (c, next) => {
    const companyId = c.req.header("X-Company-Id");
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const key = companyId ? `${opts.label}:${companyId}` : `${opts.label}:${ip}`;
    const now = Date.now();

    const entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
      await next();
      return;
    }

    entry.count++;
    if (entry.count > opts.maxRequests) {
      c.res.headers.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json(
        { error: `Rate limit exceeded. Try again later.` },
        { status: 429, headers: { "X-RateLimit-Reset": String(entry.resetAt) } }
      );
    }

    await next();
  });
}

export const apiRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 120, label: "api" });
export const generateRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 10, label: "generate" });
