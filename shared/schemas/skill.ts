import { z } from "zod";

export const marketingSkillSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(64),
  title: z.string().min(1).max(256),
  category: z.string(),
  markdownContent: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const skillCategorySchema = z.enum([
  "Conversion Optimization",
  "Content & Copy",
  "SEO & Discovery",
  "Paid & Distribution",
  "Measurement & Testing",
  "Retention",
  "Growth Engineering",
  "Strategy & Monetization",
  "Sales & RevOps",
]);

export type MarketingSkill = z.infer<typeof marketingSkillSchema>;
