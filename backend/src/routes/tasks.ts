import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const tasksRouter = new Hono();

tasksRouter.get("/", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const tasks = await db
    .select()
    .from(schema.userTask)
    .where(
      and(
        eq(schema.userTask.userId, tenant.userId),
        eq(schema.userTask.companyId, tenant.companyId)
      )
    )
    .all();

  return c.json({ tasks });
});

tasksRouter.post("/toggle", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const body = await c.req.json<{ taskId: string }>();
  if (!body.taskId) return c.json({ error: "taskId required" }, 400);

  const existing = await db
    .select()
    .from(schema.userTask)
    .where(
      and(
        eq(schema.userTask.id, body.taskId),
        eq(schema.userTask.userId, tenant.userId),
        eq(schema.userTask.companyId, tenant.companyId)
      )
    )
    .get();

  if (existing) {
    const newStatus = existing.status === "complete" ? "pending" : "complete";
    await db
      .update(schema.userTask)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schema.userTask.id, existing.id))
      .run();
    return c.json({ toggled: true, status: newStatus });
  }

  return c.json({ error: "Task not found" }, 404);
});

tasksRouter.patch("/:taskId", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const taskId = c.req.param("taskId");
  const body = await c.req.json<{ status?: "pending" | "in_progress" | "complete" }>();

  if (body.status && !["pending", "in_progress", "complete"].includes(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const existing = await db
    .select()
    .from(schema.userTask)
    .where(
      and(
        eq(schema.userTask.id, taskId),
        eq(schema.userTask.userId, tenant.userId),
        eq(schema.userTask.companyId, tenant.companyId)
      )
    )
    .get();

  if (!existing) return c.json({ error: "Task not found" }, 404);

  await db
    .update(schema.userTask)
    .set({ status: body.status || existing.status, updatedAt: new Date() })
    .where(eq(schema.userTask.id, taskId))
    .run();

  return c.json({ updated: true, status: body.status || existing.status });
});

tasksRouter.get("/score", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const allTasks = await db.select().from(schema.userTask);

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.status === "complete").length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  return c.json({ score, completed, total });
});
