import { z } from "zod";

export const taskStatusSchema = z.enum(["pending", "complete"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const userTaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  skillId: z.string().uuid(),
  status: taskStatusSchema,
  aiOutput: z.record(z.unknown()).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const toggleTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export type UserTask = z.infer<typeof userTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
