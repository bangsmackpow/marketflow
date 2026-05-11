import pino from "pino";
import { createMiddleware } from "hono/factory";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const companyId = c.req.header("X-Company-Id") || "none";
  const userId = c.get("user")?.id || "anonymous";

  logger.info({ method, path, companyId, userId }, "incoming request");

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({ method, path, companyId, userId, status, duration }, "request completed");
});
