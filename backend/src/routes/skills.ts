import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const skillsRouter = new Hono();

skillsRouter.get("/", async (c) => {
  const category = c.req.query("category");
  const filter = category ? eq(schema.marketingSkill.category, category) : undefined;

  const skills = await db
    .select()
    .from(schema.marketingSkill)
    .where(filter)
    .orderBy(schema.marketingSkill.category, schema.marketingSkill.title);

  return c.json({ skills });
});

skillsRouter.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const skill = await db
    .select()
    .from(schema.marketingSkill)
    .where(eq(schema.marketingSkill.slug, slug))
    .get();

  if (!skill) {
    return c.json({ error: "Skill not found" }, 404);
  }

  return c.json({ skill });
});

skillsRouter.get("/categories", async (c) => {
  const rows = await db
    .select({ category: schema.marketingSkill.category })
    .from(schema.marketingSkill)
    .groupBy(schema.marketingSkill.category)
    .all();

  return c.json({ categories: rows.map((r) => r.category) });
});
