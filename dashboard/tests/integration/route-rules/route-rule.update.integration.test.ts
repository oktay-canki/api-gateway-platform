import { beforeEach, describe, expect, it } from "vitest";
import type { HydratedDocument } from "mongoose";

import { PATCH } from "@/app/api/apis/[apiId]/routes/[routeRuleId]/route";
import { Api } from "@/modules/apis/api.model";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { User } from "@/modules/users/user.model";
import type { IApiDocument } from "@/modules/apis/api.document";
import type { IUserDocument } from "@/modules/users/user.document";

import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { buildApiKeyFields, buildApiPayload } from "../../helpers/api";
import { createRouteRules } from "../../helpers/route-rule";
import { createJsonRequest } from "../../helpers/request";

describe("PATCH /api/apis/:apiId/routes/:routeRuleId", () => {
  let user: HydratedDocument<IUserDocument>;
  let api: HydratedDocument<IApiDocument>;

  beforeEach(async () => {
    await RouteRule.deleteMany({});
    await Api.deleteMany({});
    await User.deleteMany({});

    resetAuthMock();

    user = await setupAuthenticatedUser();

    api = await Api.create({
      userId: user._id,
      ...buildApiPayload(),
      ...buildApiKeyFields(),
    });
  });

  it("updates a route rule", async () => {
    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          routePattern: "/users/:id",
          allowedMethods: ["GET"],
          timeoutMs: 10_000,
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      id: routeRule._id.toString(),
      apiId: api._id.toString(),
      routePattern: "/users/:id",
      allowedMethods: ["GET"],
      timeoutMs: 10_000,
    });

    const updatedRouteRule = await RouteRule.findById(routeRule._id);

    expect(updatedRouteRule).toMatchObject({
      routePattern: "/users/:id",
      allowedMethods: ["GET"],
      timeoutMs: 10_000,
    });
  });

  it("supports partial updates", async () => {
    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          timeoutMs: 10_000,
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      id: routeRule._id.toString(),
      apiId: api._id.toString(),
      routePattern: "/users/*",
      timeoutMs: 10_000,
    });
  });

  it("rejects token-bucket rate limiting for Free users", async () => {
    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
        overrides: {
          rateLimit: {
            algorithm: "sliding-window",
            maxRequests: 50,
            windowMs: 60_000,
          },
        },
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          rateLimit: {
            algorithm: "token-bucket",
            capacity: 100,
            refillRate: 10,
            refillIntervalMs: 1_000,
          },
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(403);

    const body = await response.json();

    expect(body.message).toBe(
      "Token bucket rate limiting requires a Pro plan.",
    );

    const unchangedRouteRule = await RouteRule.findById(routeRule._id);

    expect(unchangedRouteRule?.rateLimit?.algorithm).toBe("sliding-window");
  });

  it("allows token-bucket rate limiting for Pro users", async () => {
    await User.findByIdAndUpdate(user._id, {
      plan: "pro",
    });

    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          rateLimit: {
            algorithm: "token-bucket",
            capacity: 100,
            refillRate: 10,
            refillIntervalMs: 1_000,
          },
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      rateLimit: {
        algorithm: "token-bucket",
        capacity: 100,
        refillRate: 10,
        refillIntervalMs: 1_000,
      },
    });

    const updatedRouteRule = await RouteRule.findById(routeRule._id);

    expect(updatedRouteRule?.rateLimit?.algorithm).toBe("token-bucket");
  });

  it("rejects invalid request data", async () => {
    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          routePattern: "",
          timeoutMs: 0,
          allowedMethods: [],
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("returns not found for a route rule belonging to another API", async () => {
    const [otherApi] = await Api.create([
      {
        userId: user._id,
        ...buildApiPayload({
          name: "Other API",
          baseUrl: "https://other.example.com",
        }),
        ...buildApiKeyFields(),
      },
    ]);

    const [routeRule] = await createRouteRules([
      {
        apiId: otherApi._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          timeoutMs: 10_000,
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects an unauthenticated request", async () => {
    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    resetAuthMock();

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "PATCH",
        body: {
          timeoutMs: 10_000,
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });
});
