import {
  createApiSchema,
  updateApiSchema,
} from "@/modules/apis/api.validation";
import { describe, expect, it } from "vitest";

describe("createApiSchema", () => {
  it("accepts a valid API", () => {
    const result = createApiSchema.safeParse({
      name: "My API",
      baseUrl: "https://api.example.com",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
      allowedMethods: ["GET", "POST"],
      timeoutMs: 5_000,
      retryPolicy: {},
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.rateLimit.enabled).toBe(true);

      expect(result.data.retryPolicy).toEqual({
        enabled: false,
        maxRetries: 3,
        retryDelayMs: 500,
      });
    }
  });

  it("rejects when required fields are missing", () => {
    const result = createApiSchema.safeParse({
      name: "My API",
    });

    expect(result.success).toBe(false);
  });

  it("accepts both supported rate limit algorithms", () => {
    const slidingWindow = createApiSchema.safeParse({
      name: "My API",
      baseUrl: "https://api.example.com",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
      allowedMethods: ["GET"],
      timeoutMs: 5_000,
      retryPolicy: {},
    });

    const tokenBucket = createApiSchema.safeParse({
      name: "My API",
      baseUrl: "https://api.example.com",
      rateLimit: {
        algorithm: "token-bucket",
        capacity: 100,
        refillRate: 10,
        refillIntervalMs: 1_000,
      },
      allowedMethods: ["GET"],
      timeoutMs: 5_000,
      retryPolicy: {},
    });

    expect(slidingWindow.success).toBe(true);
    expect(tokenBucket.success).toBe(true);
  });

  it("rejects invalid rate limit algorithms", () => {
    const result = createApiSchema.safeParse({
      name: "My API",
      baseUrl: "https://api.example.com",
      rateLimit: {
        algorithm: "fixed-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
      allowedMethods: ["GET"],
      timeoutMs: 5_000,
      retryPolicy: {},
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid URLs", () => {
    const result = createApiSchema.safeParse({
      name: "My API",
      baseUrl: "not-a-url",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
      allowedMethods: ["GET"],
      timeoutMs: 5_000,
      retryPolicy: {},
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsupported HTTP methods", () => {
    const result = createApiSchema.safeParse({
      name: "My API",
      baseUrl: "https://api.example.com",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 100,
        windowMs: 60_000,
      },
      allowedMethods: ["INVALID"],
      timeoutMs: 5_000,
      retryPolicy: {},
    });

    expect(result.success).toBe(false);
  });
});

describe("updateApiSchema", () => {
  it("accepts partial updates", () => {
    expect(
      updateApiSchema.safeParse({
        name: "Updated API",
      }).success,
    ).toBe(true);

    expect(
      updateApiSchema.safeParse({
        timeoutMs: 10_000,
      }).success,
    ).toBe(true);

    expect(updateApiSchema.safeParse({}).success).toBe(true);
  });

  it("still validates supplied fields", () => {
    const result = updateApiSchema.safeParse({
      baseUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});
