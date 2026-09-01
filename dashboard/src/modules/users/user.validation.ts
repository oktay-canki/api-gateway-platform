import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;
