import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { logger } from "../middleware/logger.js";

type AppVars = {
  user: { id: string; email: string; name: string; image?: string | null } | null;
  session: { id: string; userId: string; expiresAt: Date; activeOrganizationId?: string | null } | null;
  tenant: { userId: string; companyId: string; role: string } | null;
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase());

export const adminRouter = new Hono<{ Variables: AppVars }>();

adminRouter.use("*", async (c, next) => {
  const session = c.get("session");
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const user = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.userId))
    .get();

  if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    logger.warn({ userId: session.userId, email: user?.email }, "admin access denied");
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});

adminRouter.get("/companies", async (c) => {
  const search = c.req.query("search")?.toLowerCase();
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 100);
  const offset = (page - 1) * limit;

  const companies = await db
    .select({
      id: schema.company.id,
      name: schema.company.name,
      slug: schema.company.slug,
      productContext: schema.company.productContext,
      createdAt: schema.company.createdAt,
    })
    .from(schema.company)
    .all();

  const filtered = search
    ? companies.filter((c) => c.name.toLowerCase().includes(search) || c.slug.toLowerCase().includes(search))
    : companies;

  const pageItems = filtered.slice(offset, offset + limit);
  const result = [];

  for (const company of pageItems) {
    const taskCounts = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${schema.userTask.status} = 'complete' then 1 else 0 end)`,
      })
      .from(schema.userTask)
      .where(eq(schema.userTask.companyId, company.id))
      .get();

    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.member)
      .where(eq(schema.member.organizationId, company.id))
      .get();

    const total = taskCounts?.total || 0;
    const completed = taskCounts?.completed || 0;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    result.push({
      ...company,
      completenessScore: score,
      activeUsers: memberCount?.count || 0,
      totalUsers: memberCount?.count || 0,
    });
  }

  return c.json({ companies: result, total: filtered.length, page, limit });
});

adminRouter.post("/impersonate", async (c) => {
  const body = await c.req.json<{ companyId: string; userId?: string }>();
  if (!body.companyId) return c.json({ error: "companyId required" }, 400);

  let targetUserId = body.userId;
  if (!targetUserId) {
    const firstMember = await db
      .select()
      .from(schema.member)
      .where(eq(schema.member.organizationId, body.companyId))
      .get();
    if (!firstMember) return c.json({ error: "No users in company" }, 404);
    targetUserId = firstMember.userId;
  }

  return c.json({
    targetUserId,
    companyId: body.companyId,
  });
});

adminRouter.post("/refresh-skills", async (c) => {
  try {
    const { execSync } = require("child_process");
    execSync("npx tsx backend/src/skills/loader.ts", {
      stdio: "pipe",
      timeout: 60000,
      cwd: process.cwd(),
    });
    return c.json({ message: "Skills refreshed successfully" });
  } catch (err) {
    logger.error({ err }, "Skill refresh failed");
    return c.json({ error: "Skill refresh failed" }, 500);
  }
});
