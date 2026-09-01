import { beforeEach, describe, expect, it } from "vitest";
import { HydratedDocument } from "mongoose";
import { POST } from "@/app/api/apis/[apiId]/routes/route";
import { Api } from "@/modules/apis/api.model";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { User } from "@/modules/users/user.model";
import { IUser } from "@/modules/users/user.schema";
import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { buildApiPayload } from "../../helpers/api";
import {
  buildRouteRulePayload,
  createRouteRules,
} from "../../helpers/route-rule";
import { createJsonRequest } from "../../helpers/request";
import { IApi } from "@/modules/apis/api.schema";

describe("POST /api/apis/:apiId/routes", () => {
  let user: HydratedDocument<IUser>;
  let api: HydratedDocument<IApi>;

  beforeEach(async () => {
    await RouteRule.deleteMany({});
    await Api.deleteMany({});
    await User.deleteMany({});

    resetAuthMock();

    user = await setupAuthenticatedUser();

    api = await Api.create({
      userId: user._id,
      ...buildApiPayload(),
    });
  });

  it("creates a route rule with sliding-window rate limit", async () => {
    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload({
          routePattern: "/users/*",
          rateLimit: {
            algorithm: "sliding-window",
            maxRequests: 50,
            windowMs: 60_000,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body).toMatchObject({
      routePattern: "/users/*",
      rateLimit: {
        algorithm: "sliding-window",
        maxRequests: 50,
        windowMs: 60_000,
      },
      allowedMethods: ["GET", "POST"],
      timeoutMs: 5_000,
      retryPolicy: {
        enabled: true,
        maxRetries: 2,
        retryDelayMs: 500,
      },
    });
  });

  it("creates a route rule with token-bucket rate limit", async () => {
    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload({
          routePattern: "/products/*",
          rateLimit: {
            algorithm: "token-bucket",
            capacity: 100,
            refillRate: 10,
            refillIntervalMs: 1_000,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body).toMatchObject({
      routePattern: "/products/*",
      rateLimit: {
        algorithm: "token-bucket",
        capacity: 100,
        refillRate: 10,
        refillIntervalMs: 1_000,
      },
    });
  });

  it("creates a route rule without optional configuration", async () => {
    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: {
          routePattern: "/health",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body).toMatchObject({
      routePattern: "/health",
    });
  });

  it("rejects invalid request data", async () => {
    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload({
          routePattern: "",
          timeoutMs: 0,
          allowedMethods: [],
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects an invalid rate-limit configuration", async () => {
    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload({
          rateLimit: {
            algorithm: "sliding-window",
            maxRequests: 0,
            windowMs: 60_000,
          },
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects a duplicate route rule", async () => {
    await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload({
          routePattern: "/users/*",
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(409);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("returns not found for a non-existent API", async () => {
    const apiId = "507f1f77bcf86cd799439011";

    const request = createJsonRequest(
      `http://localhost/api/apis/${apiId}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload(),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ apiId }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects an unauthenticated request", async () => {
    resetAuthMock();

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "POST",
        body: buildRouteRulePayload(),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });
});
