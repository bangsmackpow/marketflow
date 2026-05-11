import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app";
import { logger } from "./middleware/logger";
import { validateEnvironment } from "./lib/env-validator";

const { valid, warnings } = validateEnvironment();

if (!valid) {
  logger.fatal("Environment validation failed. Shutting down.");
  process.exit(1);
}

if (warnings.length > 0) {
  logger.warn({ warnings }, "Non-fatal environment warnings");
}

const port = parseInt(process.env.PORT || "3001", 10);

serve({ fetch: app.fetch, port });

logger.info({ port, node: process.version, env: process.env.NODE_ENV || "development" }, "MarketFlow server started");
