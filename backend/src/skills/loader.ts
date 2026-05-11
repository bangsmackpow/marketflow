import "dotenv/config";
import fs from "fs";
import path from "path";
import { remark } from "remark";
import frontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";

const SKILLS_REPO = "/tmp/marketingskills/skills";
const DB_PATH = "./data/marketflow.db";

const CATEGORY_MAP: Record<string, string> = {
  "ab-test-setup": "Conversion Optimization",
  "form-cro": "Conversion Optimization",
  "onboarding-cro": "Conversion Optimization",
  "page-cro": "Conversion Optimization",
  "paywall-upgrade-cro": "Conversion Optimization",
  "popup-cro": "Conversion Optimization",
  "signup-flow-cro": "Conversion Optimization",
  "cold-email": "Content & Copy",
  "copy-editing": "Content & Copy",
  "copywriting": "Content & Copy",
  "email-sequence": "Content & Copy",
  "image": "Content & Copy",
  "social-content": "Content & Copy",
  "video": "Content & Copy",
  "ai-seo": "SEO & Discovery",
  "competitor-alternatives": "SEO & Discovery",
  "programmatic-seo": "SEO & Discovery",
  "schema-markup": "SEO & Discovery",
  "seo-audit": "SEO & Discovery",
  "site-architecture": "SEO & Discovery",
  "directory-submissions": "SEO & Discovery",
  "ad-creative": "Paid & Distribution",
  "paid-ads": "Paid & Distribution",
  "aso-audit": "Paid & Distribution",
  "analytics-tracking": "Measurement & Testing",
  "churn-prevention": "Retention",
  "community-marketing": "Retention",
  "co-marketing": "Growth Engineering",
  "free-tool-strategy": "Growth Engineering",
  "lead-magnets": "Growth Engineering",
  "referral-program": "Growth Engineering",
  "launch-strategy": "Strategy & Monetization",
  "marketing-ideas": "Strategy & Monetization",
  "marketing-psychology": "Strategy & Monetization",
  "pricing-strategy": "Strategy & Monetization",
  "content-strategy": "Strategy & Monetization",
  "product-marketing-context": "Strategy & Monetization",
  "competitor-profiling": "Sales & RevOps",
  "customer-research": "Sales & RevOps",
  "revops": "Sales & RevOps",
  "sales-enablement": "Sales & RevOps",
};

interface SkillFrontmatter {
  name?: string;
  description?: string;
  metadata?: { version?: string };
}

function parseFrontmatter(content: string): {
  frontmatter: SkillFrontmatter;
  body: string;
} {
  const result: SkillFrontmatter = {};
  let body = content;

  const processor = remark().use(frontmatter, ["yaml"]);

  const tree = processor.parse(content);
  visit(tree, "yaml", (node: { value: string }) => {
    Object.assign(result, parseYaml(node.value));
  });

  const fmMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (fmMatch) {
    body = fmMatch[1].trim();
  }

  return { frontmatter: result, body };
}

function cloneRepo(): boolean {
  if (fs.existsSync(SKILLS_REPO)) {
    console.log("[Loader] Skills repo already exists, skipping clone.");
    return true;
  }

  const parentDir = path.dirname(SKILLS_REPO);
  if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

  const { execSync } = require("child_process");
  try {
    execSync(
      `git clone https://github.com/coreyhaines31/marketingskills.git ${SKILLS_REPO}`,
      { stdio: "pipe", timeout: 30000 }
    );
    console.log("[Loader] Skills repo cloned successfully.");
    return true;
  } catch (err) {
    console.error("[Loader] Failed to clone repo:", err);
    return false;
  }
}

async function main() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (!cloneRepo()) process.exit(1);

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite, { schema });

  const skillDirs = fs
    .readdirSync(SKILLS_REPO, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);

  console.log(`[Loader] Found ${skillDirs.length} skill directories`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const dirName of skillDirs) {
    const skillPath = path.join(SKILLS_REPO, dirName, "SKILL.md");

    if (!fs.existsSync(skillPath)) {
      skipped++;
      continue;
    }

    const raw = fs.readFileSync(skillPath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);

    const slug = frontmatter.name || dirName;
    const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const description = frontmatter.description || "";
    const category = CATEGORY_MAP[slug] || "Other";
    const version = frontmatter.metadata?.version || "1.0.0";

    const existing = await db
      .select()
      .from(schema.marketingSkill)
      .where(eq(schema.marketingSkill.slug, slug))
      .get();

    if (existing) {
      await db
        .update(schema.marketingSkill)
        .set({
          title,
          category,
          markdownContent: raw,
          metadata: { version, description },
          updatedAt: new Date(),
        })
        .where(eq(schema.marketingSkill.slug, slug))
        .run();
      updated++;
      console.log(`  UPDATE ${slug}`);
    } else {
      await db.insert(schema.marketingSkill).values({
        id: crypto.randomUUID(),
        slug,
        title,
        category,
        markdownContent: raw,
        metadata: { version, description },
      });
      inserted++;
      console.log(`  INSERT ${slug}`);
    }
  }

  console.log(
    `\n[Loader] Complete — Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`
  );
  sqlite.close();
}

main().catch((err) => {
  console.error("[Loader] Fatal error:", err);
  process.exit(1);
});
