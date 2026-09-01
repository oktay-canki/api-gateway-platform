import { z } from "zod";
import { HTTP_METHODS } from "./api.schema";

const slidingWindowRateLimitSchema = z.object({
  enabled: z.boolean().default(true),
  algorithm: z.literal("sliding-window"),
  maxRequests: z.number().int().positive(),
  windowMs: z.number().int().positive(),
});

const tokenBucketRateLimitSchema = z.object({
  enabled: z.boolean().default(true),
  algorithm: z.literal("token-bucket"),
  capacity: z.number().int().positive(),
  refillRate: z.number().positive(),
  refillIntervalMs: z.number().int().positive(),
});

const rateLimitSchema = z.discriminatedUnion("algorithm", [
  slidingWindowRateLimitSchema,
  tokenBucketRateLimitSchema,
]);

const retryPolicySchema = z.object({
  enabled: z.boolean().default(false),
  maxRetries: z.number().int().min(0).max(5).default(3),
  retryDelayMs: z.number().int().min(0).default(500),
});

export const createApiSchema = z.object({
  name: z.string().trim().min(1).max(100),

  baseUrl: z.url(),

  rateLimit: rateLimitSchema,

  allowedMethods: z.array(z.enum(HTTP_METHODS)).min(1),

  timeoutMs: z.number().int().positive(),

  retryPolicy: retryPolicySchema,
});

export type CreateApiInput = z.infer<typeof createApiSchema>;

export const updateApiSchema = createApiSchema.partial();

export type UpdateApiInput = z.infer<typeof updateApiSchema>;
