import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/marketflow.db";
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "last_login" integer,
    "email_verified" integer DEFAULT false NOT NULL,
    "image" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "token" text NOT NULL UNIQUE,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "expires_at" integer NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "active_organization_id" text,
    "impersonated_by" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" integer,
    "refresh_token_expires_at" integer,
    "scope" text,
    "password" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" integer NOT NULL,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "organization" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "logo" text,
    "metadata" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "member" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "role" text DEFAULT 'member' NOT NULL,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "invitation" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "expires_at" integer NOT NULL,
    "inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "companies" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "product_context" text,
    "analytics_tokens" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "marketing_skills" (
    "id" text PRIMARY KEY NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "title" text NOT NULL,
    "category" text NOT NULL,
    "markdown_content" text NOT NULL,
    "metadata" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "user_tasks" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "company_id" text NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
    "skill_id" text NOT NULL REFERENCES "marketing_skills"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'pending' NOT NULL,
    "ai_output" text,
    "created_at" integer DEFAULT (current_timestamp) NOT NULL,
    "updated_at" integer DEFAULT (current_timestamp) NOT NULL
  );
`);

const migrations = [
  `DELETE FROM "session"`,
  `ALTER TABLE "session" ADD COLUMN "token" text NOT NULL DEFAULT ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "idx_session_token" ON "session"("token")`,
];

for (const stmt of migrations) {
  try {
    sqlite.exec(stmt);
  } catch {
    // Migration already applied, skipping
  }
}

sqlite.close();
console.log("[Migrate] Tables created successfully");
