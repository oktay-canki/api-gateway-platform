import { beforeEach, describe, expect, it } from "vitest";
import type { HydratedDocument } from "mongoose";

import { GET } from "@/app/api/apis/[apiId]/route";
import { Api } from "@/modules/apis/api.model";
import type { IApiDocument } from "@/modules/apis/api.document";
import type { IUserDocument } from "@/modules/users/user.document";
import { User } from "@/modules/users/user.model";
import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { createApis } from "../../helpers/api";
import { createJsonRequest } from "../../helpers/request";
import { createUser } from "../../helpers/user";

describe("GET /api/apis/:apiId", () => {
  let user: HydratedDocument<IUserDocument>;
  let api: HydratedDocument<IApiDocument>;

  beforeEach(async () => {
    await Api.deleteMany({});
    await User.deleteMany({});

    resetAuthMock();

    user = await setupAuthenticatedUser();

    [api] = await createApis([
      {
        userId: user._id,
        name: "My API",
        baseUrl: "https://my.example.com",
      },
    ]);
  });

  it("returns the API", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "GET",
    });

    const response = await GET(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      id: api._id.toString(),
      name: api.name,
      baseUrl: api.baseUrl,
    });
  });

  it("returns not found for a non-existent API", async () => {
    const request = createJsonRequest(
      "http://localhost/api/apis/507f1f77bcf86cd799439011",
      { method: "GET" },
    );

    const response = await GET(request, {
      params: Promise.resolve({ apiId: "507f1f77bcf86cd799439011" }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("returns not found for an API belonging to another user", async () => {
    const otherUser = await createUser();

    const [otherApi] = await createApis([
      {
        userId: otherUser._id,
        name: "Other API",
        baseUrl: "https://other.example.com",
      },
    ]);

    const request = createJsonRequest(
      `http://localhost/api/apis/${otherApi._id}`,
      { method: "GET" },
    );

    const response = await GET(request, {
      params: Promise.resolve({ apiId: otherApi._id.toString() }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects an unauthenticated request", async () => {
    resetAuthMock();

    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "GET",
    });

    const response = await GET(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });
});
