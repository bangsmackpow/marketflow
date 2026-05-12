import { db } from "./index.js";
import * as schema from "./schema.js";
import { eq } from "drizzle-orm";
import { auth } from "../auth/config.js";
import { logger } from "../middleware/logger.js";

export async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn("[Seed] ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping");
    return;
  }

  const existing = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .get();

  if (existing) {
    logger.info({ email }, "[Seed] Admin user already exists, skipping");
    return;
  }

  try {
    const name = process.env.ADMIN_NAME || "Admin";
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    if (!result?.user) {
      logger.error("[Seed] Sign-up returned no user");
      return;
    }

    logger.info({ email, userId: result.user.id }, "[Seed] Admin user created");

    const orgName = process.env.ADMIN_COMPANY || "Built Networks";
    const orgSlug = process.env.ADMIN_SLUG || "built-networks";

    await auth.api.createOrganization({
      body: { name: orgName, slug: orgSlug, userId: result.user.id },
    });

    logger.info({ orgName }, "[Seed] Admin company created");
  } catch (err: any) {
    logger.error({ err: err.message || String(err) }, "[Seed] Failed");
  }
}
