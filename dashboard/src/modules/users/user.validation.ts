import { PLANS } from "@/modules/users/user.types";
import { z } from "zod";

export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  plan: z.enum(PLANS),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
  email: z.email("Please enter a valid email address"),

  password: z.string().min(1, "Password is required"),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const changePlanSchema = z.object({
  plan: z.enum(PLANS),
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;
