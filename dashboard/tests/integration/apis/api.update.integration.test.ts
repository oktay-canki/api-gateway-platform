import { beforeEach, describe, expect, it } from "vitest";
import type { HydratedDocument } from "mongoose";
import { PATCH } from "@/app/api/apis/[apiId]/route";
import { Api } from "@/modules/apis/api.model";
import type { IApiDocument } from "@/modules/apis/api.document";
import type { IUserDocument } from "@/modules/users/user.document";
import { User } from "@/modules/users/user.model";
import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { buildApiKeyFields, buildApiPayload } from "../../helpers/api";
import { createJsonRequest } from "../../helpers/request";
import { createUser } from "../../helpers/user";

describe("PATCH /api/apis/:apiId", () => {
  let user: HydratedDocument<IUserDocument>;
  let api: HydratedDocument<IApiDocument>;

  beforeEach(async () => {
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

  it("updates an API", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        name: "Updated API",
        timeoutMs: 10_000,
        allowedMethods: ["GET", "POST", "PUT"],
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      name: "Updated API",
      baseUrl: "https://api.example.com",
      timeoutMs: 10_000,
      allowedMethods: ["GET", "POST", "PUT"],
    });

    const updatedApi = await Api.findById(api._id);

    expect(updatedApi).not.toBeNull();
    expect(updatedApi?.name).toBe("Updated API");
    expect(updatedApi?.timeoutMs).toBe(10_000);
  });

  it("rejects token-bucket updates for free users", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        rateLimit: {
          enabled: true,
          algorithm: "token-bucket",
          capacity: 200,
          refillRate: 20,
          refillIntervalMs: 1_000,
        },
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(403);

    const body = await response.json();

    expect(body.message).toBe(
      "Token bucket rate limiting requires a Pro plan.",
    );

    const updatedApi = await Api.findById(api._id);

    expect(updatedApi?.rateLimit.algorithm).not.toBe("token-bucket");
  });

  it("updates the rate limit configuration for Pro users", async () => {
    await User.findByIdAndUpdate(user._id, {
      plan: "pro",
    });

    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        rateLimit: {
          enabled: true,
          algorithm: "token-bucket",
          capacity: 200,
          refillRate: 20,
          refillIntervalMs: 1_000,
        },
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.rateLimit).toMatchObject({
      enabled: true,
      algorithm: "token-bucket",
      capacity: 200,
      refillRate: 20,
      refillIntervalMs: 1_000,
    });

    const updatedApi = await Api.findById(api._id);

    expect(updatedApi?.rateLimit.algorithm).toBe("token-bucket");
  });

  it("updates the retry policy", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        retryPolicy: {
          enabled: true,
          maxRetries: 5,
          retryDelayMs: 1_000,
        },
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.retryPolicy).toMatchObject({
      enabled: true,
      maxRetries: 5,
      retryDelayMs: 1_000,
    });
  });

  it("rejects invalid request data", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        name: "",
        baseUrl: "not-a-url",
        timeoutMs: 0,
        allowedMethods: [],
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects an invalid rate-limit configuration", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        rateLimit: {
          enabled: true,
          algorithm: "sliding-window",
          capacity: 100,
          refillRate: 10,
          refillIntervalMs: 1_000,
        },
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects an invalid HTTP method", async () => {
    const request = createJsonRequest(`http://localhost/api/apis/${api._id}`, {
      method: "PATCH",
      body: {
        allowedMethods: ["INVALID"],
      },
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: api._id.toString() }),
    });

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("returns not found for a non-existent API", async () => {
    const request = createJsonRequest(
      "http://localhost/api/apis/507f1f77bcf86cd799439011",
      {
        method: "PATCH",
        body: {
          name: "Updated API",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        apiId: "507f1f77bcf86cd799439011",
      }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });

  it("rejects updating an API belonging to another user", async () => {
    const otherUser = await createUser();

    const otherApi = await Api.create({
      userId: otherUser._id,
      ...buildApiPayload(),
      ...buildApiKeyFields(),
    });

    const request = createJsonRequest(
      `http://localhost/api/apis/${otherApi._id}`,
      {
        method: "PATCH",
        body: {
          name: "Updated API",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ apiId: otherApi._id.toString() }),
    });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });
});
