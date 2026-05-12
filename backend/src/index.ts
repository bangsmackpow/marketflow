import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { logger } from "./middleware/logger.js";
import { validateEnvironment } from "./lib/env-validator.js";
import "./db/migrate.js";
import { seedAdminUser } from "./db/seed.js";

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

seedAdminUser();
