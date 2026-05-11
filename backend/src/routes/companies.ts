import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";

type ProductContext = Record<string, string> | null | undefined;

export const companiesRouter = new Hono();

companiesRouter.get("/settings", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const company = await db
    .select()
    .from(schema.company)
    .where(eq(schema.company.id, tenant.companyId))
    .get();

  if (!company) return c.json({ error: "Company not found" }, 404);

  const ctx = company.productContext as ProductContext;

  return c.json({
    settings: { industry: ctx?.industry ?? null },
    company: { id: company.id, name: company.name, slug: company.slug },
  });
});

companiesRouter.patch("/settings", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const body = await c.req.json<{ industry?: string }>();

  if (body.industry) {
    const company = await db
      .select()
      .from(schema.company)
      .where(eq(schema.company.id, tenant.companyId))
      .get();

    if (company) {
      const ctx = (company.productContext as ProductContext) || {};
      await db
        .update(schema.company)
        .set({
          productContext: { ...ctx, industry: body.industry },
          updatedAt: new Date(),
        })
        .where(eq(schema.company.id, tenant.companyId))
        .run();
    }
  }

  return c.json({ updated: true });
});
