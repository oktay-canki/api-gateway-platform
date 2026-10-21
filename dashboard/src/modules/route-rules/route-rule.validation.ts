import { HTTP_METHODS } from "@/modules/apis/api.types";
import { normalizeRoutePattern } from "@/modules/route-rules/normalize-route-rule";
import { match } from "path-to-regexp";
import { z } from "zod";

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
  routePattern: z
    .string()
    .trim()
    .min(1)
    .refine((pattern) => pattern.startsWith("/"), {
      message: "Route pattern must start with '/'",
    })
    .refine(
      (pattern) => {
        try {
          match(normalizeRoutePattern(pattern));
          return true;
        } catch {
          return false;
        }
      },
      { message: "Invalid route pattern syntax" },
    ),

  rateLimit: rateLimitSchema.optional(),
  allowedMethods: z.array(z.enum(HTTP_METHODS)).min(1).optional(),
  timeoutMs: z.number().int().positive().optional(),
  retryPolicy: retryPolicySchema.optional(),
});

export type CreateRouteRuleInput = z.infer<typeof createRouteRuleSchema>;

export const updateRouteRuleSchema = createRouteRuleSchema
  .extend({
    rateLimit: rateLimitSchema.nullable().optional(),

    allowedMethods: z.array(z.enum(HTTP_METHODS)).min(1).nullable().optional(),

    timeoutMs: z.number().int().positive().nullable().optional(),

    retryPolicy: retryPolicySchema.nullable().optional(),
  })
  .partial();

export type UpdateRouteRuleInput = z.infer<typeof updateRouteRuleSchema>;
