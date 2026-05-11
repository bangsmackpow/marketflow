import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth } from "./auth/config";
import { tenantGuard } from "./middleware/tenant";
import { requestLogger } from "./middleware/logger";
import { apiRateLimit, generateRateLimit } from "./middleware/rate-limit";
import { healthRouter } from "./routes/health";
import { skillsRouter } from "./routes/skills";
import { tasksRouter } from "./routes/tasks";
import { authRouter } from "./routes/auth";
import { companiesRouter } from "./routes/companies";
import { analyticsRouter } from "./routes/analytics";
import { generateRouter } from "./routes/generate";
import { adminRouter } from "./routes/admin";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    tenant: { userId: string; companyId: string; role: string } | null;
  };
}>();

app.use("*", requestLogger);

app.use(
  "/api/v1/auth/*",
  cors({
    origin: process.env.BETTER_AUTH_URL || "http://localhost:3001",
    allowHeaders: ["Content-Type", "Authorization", "X-Company-Id"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

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
