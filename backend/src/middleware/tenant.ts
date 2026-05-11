import { createMiddleware } from "hono/factory";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";

interface TenantContext {
  userId: string;
  companyId: string;
  role: string;
}

declare module "hono" {
  interface ContextVariableMap {
    tenant: TenantContext | null;
  }
}

export const tenantGuard = createMiddleware(async (c, next) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const companyId = c.req.header("X-Company-Id");
  if (!companyId) {
    return c.json({ error: "X-Company-Id header is required" }, 400);
  }

  const membership = await db
    .select({ role: schema.member.role })
    .from(schema.member)
    .where(
      and(
        eq(schema.member.userId, session.userId),
        eq(schema.member.organizationId, companyId)
      )
    )
    .get();

  if (!membership) {
    return c.json({ error: "Not a member of this company" }, 403);
  }

  c.set("tenant", {
    userId: session.userId,
    companyId,
    role: membership.role,
  });

  await next();
});
