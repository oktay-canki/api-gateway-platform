import { beforeEach, describe, expect, it } from "vitest";
import type { HydratedDocument } from "mongoose";

import { GET } from "@/app/api/apis/[apiId]/routes/route";
import { Api } from "@/modules/apis/api.model";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { User } from "@/modules/users/user.model";
import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { buildApiKeyFields, buildApiPayload } from "../../helpers/api";
import {
  buildRouteRulePayload,
  createRouteRules,
} from "../../helpers/route-rule";
import { createJsonRequest } from "../../helpers/request";
import type { IApiDocument } from "@/modules/apis/api.document";
import type { IUserDocument } from "@/modules/users/user.document";
import { createUser } from "../../helpers/user";

describe("GET /api/apis/:apiId/routes", () => {
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

  it("returns the route rules of the API", async () => {
    await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
      {
        apiId: api._id,
        routePattern: "/products/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "GET",
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toHaveLength(2);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...buildRouteRulePayload(),
          apiId: api._id.toString(),
          routePattern: "/users/*",
        }),
        expect.objectContaining({
          ...buildRouteRulePayload(),
          apiId: api._id.toString(),
          routePattern: "/products/*",
        }),
      ]),
    );
  });

  it("does not return route rules belonging to another API", async () => {
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

    await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
      {
        apiId: otherApi._id,
        routePattern: "/products/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "GET",
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      apiId: api._id.toString(),
      routePattern: "/users/*",
    });
  });

  it("returns an empty array when the API has no route rules", async () => {
    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes`,
      {
        method: "GET",
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual([]);
  });

  it("rejects access to another user's API", async () => {
    const otherUser = await createUser();

    const otherApi = await Api.create({
      userId: otherUser._id,
      ...buildApiPayload({
        name: "Other API",
        baseUrl: "https://other.example.com",
      }),
      ...buildApiKeyFields(),
    });

    await createRouteRules([
      {
        apiId: otherApi._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${otherApi._id}/routes`,
      {
        method: "GET",
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({
        apiId: otherApi._id.toString(),
      }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("returns not found for a non-existent API", async () => {
    const apiId = "507f1f77bcf86cd799439011";

    const request = createJsonRequest(
      `http://localhost/api/apis/${apiId}/routes`,
      {
        method: "GET",
      },
    );

    const response = await GET(request, {
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
        method: "GET",
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
      }),
    });

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });
});
