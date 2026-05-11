import { logger } from "../middleware/logger";

interface EnvCheck {
  key: string;
  optional?: boolean;
  description: string;
}

const REQUIRED_VARS: EnvCheck[] = [
  { key: "BETTER_AUTH_SECRET", description: "Encryption secret for auth tokens" },
  { key: "BETTER_AUTH_URL", description: "Public URL for auth callbacks" },
  { key: "DATABASE_URL", description: "SQLite database path (defaults to ./data/marketflow.db)", optional: true },
  { key: "PORT", description: "HTTP server port (defaults to 3000)", optional: true },
];

const OPTIONAL_VARS: EnvCheck[] = [
  { key: "GEMINI_API_KEY", description: "Gemini AI API key for content generation" },
  { key: "GA4_CLIENT_ID", description: "Google Analytics 4 OAuth client ID" },
  { key: "GA4_CLIENT_SECRET", description: "Google Analytics 4 OAuth client secret" },
  { key: "GA4_PROPERTY_ID", description: "Google Analytics 4 property ID" },
];

export function validateEnvironment(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let valid = true;

  for (const env of REQUIRED_VARS) {
    const value = process.env[env.key];
    if (!value && !env.optional) {
      logger.error({ key: env.key }, `Missing required environment variable: ${env.key}`);
      valid = false;
    } else if (!value) {
      logger.warn({ key: env.key }, `Optional environment variable not set: ${env.key}`);
      warnings.push(`${env.key} — ${env.description}`);
    }
  }

  for (const env of OPTIONAL_VARS) {
    const value = process.env[env.key];
    if (!value) {
      warnings.push(`${env.key} — ${env.description}`);
    }
  }

  if (warnings.length > 0) {
    logger.warn({ warnings }, "Environment variable warnings");
  }

  return { valid, warnings };
}
