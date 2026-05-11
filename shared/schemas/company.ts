import { z } from "zod";

export const productContextSchema = z.object({
  industry: z.string().optional(),
  audience: z.string().optional(),
  valueProposition: z.string().optional(),
  businessType: z.string().optional(),
  stage: z.enum(["idea", "mvp", "growth", "mature"]).optional(),
});

export const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(256),
  slug: z.string().min(1).max(64),
  productContext: productContextSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCompanySchema = z.object({
  name: z.string().min(1).max(256),
  slug: z.string().min(1).max(64),
  productContext: productContextSchema.optional(),
});

export const companyMemberSchema = z.object({
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

export type ProductContext = z.infer<typeof productContextSchema>;
export type Company = z.infer<typeof companySchema>;
export type CompanyMember = z.infer<typeof companyMemberSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
