import { z } from "zod";

import { HTTP_METHODS } from "../apis/api.schema";

const slidingWindowRateLimitSchema = z.object({
  algorithm: z.literal("sliding-window"),
  maxRequests: z.number().int().positive(),
  windowMs: z.number().int().positive(),
});

const tokenBucketRateLimitSchema = z.object({
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
  enabled: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(5),
  retryDelayMs: z.number().int().min(0),
});

export const createRouteRuleSchema = z.object({
  routePattern: z.string().trim().min(1),

  rateLimit: rateLimitSchema.optional(),

  allowedMethods: z.array(z.enum(HTTP_METHODS)).min(1).optional(),

  timeoutMs: z.number().int().positive().optional(),

  retryPolicy: retryPolicySchema.optional(),
});

export type CreateRouteRuleInput = z.infer<typeof createRouteRuleSchema>;

export const updateRouteRuleSchema = createRouteRuleSchema.partial();

export type UpdateRouteRuleInput = z.infer<typeof updateRouteRuleSchema>;
