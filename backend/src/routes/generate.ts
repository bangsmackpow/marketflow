import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

export const generateRouter = new Hono();

generateRouter.post("/", async (c) => {
  const tenant = c.get("tenant");
  if (!tenant) return c.json({ error: "No tenant context" }, 401);

  const body = await c.req.json<{
    skillId: string;
    formData: Record<string, string>;
  }>();

  if (!body.skillId || !body.formData) {
    return c.json({ error: "skillId and formData required" }, 400);
  }

  const skill = await db
    .select()
    .from(schema.marketingSkill)
    .where(eq(schema.marketingSkill.id, body.skillId))
    .get();

  if (!skill) return c.json({ error: "Skill not found" }, 404);

  const companyInfo = await db
    .select()
    .from(schema.company)
    .where(eq(schema.company.id, tenant.companyId))
    .get();

  const productContext = companyInfo?.productContext || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "GEMINI_API_KEY not configured" }, 500);
  }

  const systemPrompt = [
    "You are an expert marketing strategist and copywriter.",
    "You generate professional, production-ready marketing assets based on proven frameworks.",
    "Follow the instructions precisely and return only the requested output.",
    "",
    "## Company Context",
    JSON.stringify(productContext, null, 2),
    "",
    "## Marketing Framework",
    skill.markdownContent.slice(0, 4000),
  ].join("\n");

  const userPrompt = [
    "Using the above marketing framework and company context, generate the following:",
    "",
    ...Object.entries(body.formData).map(
      ([key, val]) => `${key}: ${val}`
    ),
    "",
    "Return the output as structured markdown with clear sections.",
    "Be specific, actionable, and tailored to the company context.",
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Generate] Gemini API error:", response.status, errText);
      return c.json({ error: "AI generation failed" }, 502);
    }

    const data = await response.json();
    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No output generated";
    const taskId = crypto.randomUUID();

    await db.insert(schema.userTask).values({
      id: taskId,
      userId: tenant.userId,
      companyId: tenant.companyId,
      skillId: body.skillId,
      status: "complete",
      aiOutput: { generated: output, formData: body.formData, model: "gemini-2.0-flash" },
    });

    return c.json({
      output,
      taskId,
    });
  } catch (err) {
    console.error("[Generate] Error:", err);
    return c.json({ error: "AI generation failed" }, 500);
  }
});
