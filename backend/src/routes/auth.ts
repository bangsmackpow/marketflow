import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { auth } from "../auth/config.js";

type AppVars = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const authRouter = new Hono<{ Variables: AppVars }>();

authRouter.post("/tenant-switch", async (c) => {
  const session = c.get("session");
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { companyId } = body;
  if (!companyId) return c.json({ error: "companyId required" }, 400);

  const membership = await db
    .select()
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

  await db
    .update(schema.session)
    .set({ activeOrganizationId: companyId, updatedAt: new Date() })
    .where(eq(schema.session.id, session.id))
    .run();

  return c.json({ activeOrganizationId: companyId });
});
