import { toRouteRuleResponse } from "@/modules/route-rules/route-rule.mapper";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

type RouteRuleMapperInput = {
  _id: Types.ObjectId;
  apiId: Types.ObjectId;
  routePattern: string;
  rateLimit?:
    | {
        algorithm: "sliding-window";
        maxRequests: number;
        windowMs: number;
      }
    | {
        algorithm: "token-bucket";
        capacity: number;
        refillRate: number;
        refillIntervalMs: number;
      };
  allowedMethods?: string[];
  timeoutMs?: number;
  retryPolicy?: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

describe("toRouteRuleResponse", () => {
  it("maps a route rule document to a response object", () => {
    const id = new Types.ObjectId();
    const apiId = new Types.ObjectId();

    const createdAt = new Date("2026-08-18T10:00:00.000Z");
    const updatedAt = new Date("2026-08-18T11:00:00.000Z");

    const routeRule: RouteRuleMapperInput = {
      _id: id,
      apiId,
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
      createdAt,
      updatedAt,
    };

    const result = toRouteRuleResponse(
      routeRule as Parameters<typeof toRouteRuleResponse>[0],
    );

    expect(result).toEqual({
      id: id.toString(),
      apiId: apiId.toString(),
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
      createdAt,
      updatedAt,
    });
  });

  it("maps a route rule without optional fields", () => {
    const routeRule: RouteRuleMapperInput = {
      _id: new Types.ObjectId(),
      apiId: new Types.ObjectId(),
      routePattern: "/users",
      createdAt: new Date("2026-08-18T10:00:00.000Z"),
      updatedAt: new Date("2026-08-18T11:00:00.000Z"),
    };

    const result = toRouteRuleResponse(
      routeRule as Parameters<typeof toRouteRuleResponse>[0],
    );

    expect(result).toEqual({
      id: routeRule._id.toString(),
      apiId: routeRule.apiId.toString(),
      routePattern: "/users",
      rateLimit: undefined,
      allowedMethods: undefined,
      timeoutMs: undefined,
      retryPolicy: undefined,
      createdAt: routeRule.createdAt,
      updatedAt: routeRule.updatedAt,
    });
  });
});
