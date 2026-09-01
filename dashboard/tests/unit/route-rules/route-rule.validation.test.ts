import {
  createRouteRuleSchema,
  updateRouteRuleSchema,
} from "@/modules/route-rules/route-rule.validation";
import { describe, expect, it } from "vitest";

describe("createRouteRuleSchema", () => {
  it("accepts a minimal route rule", () => {
    const result = createRouteRuleSchema.safeParse({
      routePattern: "/users/:id",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a complete route rule", () => {
    const result = createRouteRuleSchema.safeParse({
      routePattern: "/users/:id",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
      allowedMethods: ["GET", "POST"],
      timeoutMs: 5_000,
      retryPolicy: {
        enabled: true,
        maxRetries: 3,
        retryDelayMs: 500,
      },
    });

    expect(result.success).toBe(true);
  });

  it("trims routePattern and rejects an empty value", () => {
    const validResult = createRouteRuleSchema.safeParse({
      routePattern: "  /users/:id  ",
    });

    expect(validResult.success).toBe(true);

    if (validResult.success) {
      expect(validResult.data.routePattern).toBe("/users/:id");
    }

    const invalidResult = createRouteRuleSchema.safeParse({
      routePattern: "   ",
    });

    expect(invalidResult.success).toBe(false);
  });

  it("accepts both supported rate limit algorithms", () => {
    const slidingWindowResult = createRouteRuleSchema.safeParse({
      routePattern: "/users",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
    });

    const tokenBucketResult = createRouteRuleSchema.safeParse({
      routePattern: "/users",
      rateLimit: {
        algorithm: "token-bucket",
        capacity: 100,
        refillRate: 10,
        refillIntervalMs: 1_000,
      },
    });

    expect(slidingWindowResult.success).toBe(true);
    expect(tokenBucketResult.success).toBe(true);
  });

  it("rejects an invalid rate limit configuration", () => {
    const result = createRouteRuleSchema.safeParse({
      routePattern: "/users",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 0,
        windowMs: 60_000,
      },
    });

    expect(result.success).toBe(false);
  });

  it("applies the retry policy enabled default", () => {
    const result = createRouteRuleSchema.safeParse({
      routePattern: "/users",
      retryPolicy: {
        maxRetries: 3,
        retryDelayMs: 500,
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.retryPolicy).toEqual({
        enabled: true,
        maxRetries: 3,
        retryDelayMs: 500,
      });
    }
  });
});

describe("updateRouteRuleSchema", () => {
  it("accepts partial updates", () => {
    expect(
      updateRouteRuleSchema.safeParse({
        routePattern: "/users/:id",
      }).success,
    ).toBe(true);

    expect(
      updateRouteRuleSchema.safeParse({
        timeoutMs: 5_000,
      }).success,
    ).toBe(true);

    expect(updateRouteRuleSchema.safeParse({}).success).toBe(true);
  });

  it("still validates supplied fields", () => {
    const invalidTimeout = updateRouteRuleSchema.safeParse({
      timeoutMs: 0,
    });

    const invalidMethods = updateRouteRuleSchema.safeParse({
      allowedMethods: ["INVALID"],
    });

    expect(invalidTimeout.success).toBe(false);
    expect(invalidMethods.success).toBe(false);
  });
});
