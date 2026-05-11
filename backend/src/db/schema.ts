import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  lastLogin: integer("last_login", { mode: "timestamp" }),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  activeOrganizationId: text("active_organization_id"),
  impersonatedBy: text("impersonated_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const company = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  productContext: text("product_context", { mode: "json" }),
  analyticsTokens: text("analytics_tokens", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const marketingSkill = sqliteTable("marketing_skills", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  markdownContent: text("markdown_content").notNull(),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});

export const userTask = sqliteTable("user_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().references(() => company.id, { onDelete: "cascade" }),
  skillId: text("skill_id").notNull().references(() => marketingSkill.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "in_progress", "complete"] }).notNull().default("pending"),
  aiOutput: text("ai_output", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(current_timestamp)`),
});
