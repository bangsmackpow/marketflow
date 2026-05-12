import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth } from "./auth/config.js";
import { tenantGuard } from "./middleware/tenant.js";
import { requestLogger } from "./middleware/logger.js";
import { apiRateLimit, generateRateLimit } from "./middleware/rate-limit.js";
import { healthRouter } from "./routes/health.js";
import { skillsRouter } from "./routes/skills.js";
import { tasksRouter } from "./routes/tasks.js";
import { authRouter } from "./routes/auth.js";
import { companiesRouter } from "./routes/companies.js";
import { analyticsRouter } from "./routes/analytics.js";
import { generateRouter } from "./routes/generate.js";
import { adminRouter } from "./routes/admin.js";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    tenant: { userId: string; companyId: string; role: string } | null;
  };
}>();

app.use("*", requestLogger);

const authCors = cors({
  origin: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  allowHeaders: ["Content-Type", "Authorization", "X-Company-Id"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});

app.use("/api/auth/*", authCors);
app.use("/api/v1/auth/*", authCors);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.on(["POST", "GET"], "/api/v1/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/v1/health", healthRouter);
app.route("/api/v1/auth", authRouter);

app.use("/api/v1/*", tenantGuard);

app.use("/api/v1/generate", generateRateLimit);
app.use("/api/v1/*", apiRateLimit);

app.route("/api/v1/skills", skillsRouter);
app.route("/api/v1/tasks", tasksRouter);
app.route("/api/v1/companies", companiesRouter);
app.route("/api/v1/analytics", analyticsRouter);
app.route("/api/v1/generate", generateRouter);
app.route("/api/v1/admin", adminRouter);

if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist/client" }));
}

export default app;
