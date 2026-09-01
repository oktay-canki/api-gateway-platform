import { beforeEach, describe, expect, it } from "vitest";
import { HydratedDocument } from "mongoose";
import { DELETE } from "@/app/api/apis/[apiId]/routes/[routeRuleId]/route";
import { Api } from "@/modules/apis/api.model";
import { IApi } from "@/modules/apis/api.schema";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { User } from "@/modules/users/user.model";
import { IUser } from "@/modules/users/user.schema";
import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { buildApiPayload } from "../../helpers/api";
import { createRouteRules } from "../../helpers/route-rule";
import { createJsonRequest } from "../../helpers/request";

describe("DELETE /api/apis/:apiId/routes/:routeRuleId", () => {
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

  it("deletes a route rule", async () => {
    const [routeRule] = await createRouteRules([
      {
        apiId: api._id,
        routePattern: "/users/*",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRule._id}`,
      {
        method: "DELETE",
      },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(204);

    const deletedRouteRule = await RouteRule.findById(routeRule._id);

    expect(deletedRouteRule).toBeNull();
  });

  it("returns not found for a route rule belonging to another API", async () => {
    const [otherApi] = await Api.create([
      {
        userId: user._id,
        ...buildApiPayload({
          name: "Other API",
          baseUrl: "https://other.example.com",
        }),
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
        method: "DELETE",
      },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId: routeRule._id.toString(),
      }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");

    const existingRouteRule = await RouteRule.findById(routeRule._id);

    expect(existingRouteRule).not.toBeNull();
  });

  it("returns not found for a non-existent route rule", async () => {
    const routeRuleId = "507f1f77bcf86cd799439011";

    const request = createJsonRequest(
      `http://localhost/api/apis/${api._id}/routes/${routeRuleId}`,
      {
        method: "DELETE",
      },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({
        apiId: api._id.toString(),
        routeRuleId,
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
        method: "DELETE",
      },
    );

    const response = await DELETE(request, {
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
