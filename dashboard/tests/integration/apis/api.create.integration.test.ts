import { beforeEach, describe, expect, it } from "vitest";
import { HydratedDocument } from "mongoose";
import { GET } from "@/app/api/apis/route";
import { Api } from "@/modules/apis/api.model";
import { User } from "@/modules/users/user.model";
import { IUser } from "@/modules/users/user.schema";
import { resetAuthMock, setupAuthenticatedUser } from "../../helpers/auth";
import { createApis } from "../../helpers/api";

describe("GET /api/apis", () => {
  let user: HydratedDocument<IUser>;

  beforeEach(async () => {
    await Api.deleteMany({});
    await User.deleteMany({});

    resetAuthMock();

    user = await setupAuthenticatedUser();
  });

  it("returns the authenticated user's APIs", async () => {
    const [firstApi, secondApi] = await createApis([
      {
        userId: user._id,
        name: "Api 1",
        baseUrl: "http://example1.com",
      },
      {
        userId: user._id,
        name: "Api 2",
        baseUrl: "http://example2.com",
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toHaveLength(2);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstApi._id.toString(),
          name: firstApi.name,
          baseUrl: firstApi.baseUrl,
        }),
        expect.objectContaining({
          id: secondApi._id.toString(),
          name: secondApi.name,
          baseUrl: secondApi.baseUrl,
        }),
      ]),
    );
  });

  it("returns APIs in descending createdAt order", async () => {
    const [firstApi, secondApi] = await createApis([
      {
        userId: user._id,
        name: "Api 1",
        baseUrl: "http://example1.com",
        createdAt: new Date("2026-01-01"),
      },
      {
        userId: user._id,
        name: "Api 2",
        baseUrl: "http://example2.com",
        createdAt: new Date("2026-01-02"),
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body[0].id).toBe(secondApi._id.toString());
    expect(body[1].id).toBe(firstApi._id.toString());
  });

  it("does not return APIs belonging to another user", async () => {
    const otherUser = await User.create({
      name: "Other User",
      email: "other@example.com",
      passwordHash: "password",
      plan: "free",
    });

    const [myApi] = await createApis([
      {
        userId: user._id,
        name: "My API",
        baseUrl: "https://my.example.com",
      },
      {
        userId: otherUser._id,
        name: "Other API",
        baseUrl: "https://other.example.com",
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].name).toBe(myApi.name);
  });

  it("returns an empty array when the user has no APIs", async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual([]);
  });

  it("rejects an unauthenticated request", async () => {
    resetAuthMock();

    const response = await GET();

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body).toHaveProperty("message");
  });
});
