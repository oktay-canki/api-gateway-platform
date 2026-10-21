import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { User } from "@/modules/users/user.model";
import { createJsonRequest } from "../../helpers/request";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it("registers a new user", async () => {
    const request = createJsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        plan: "pro",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);

    const body = await response.json();

    expect(body).toMatchObject({
      name: "John Doe",
      email: "john@example.com",
      plan: "pro",
    });

    expect(body.passwordHash).toBeUndefined();

    const user = await User.findOne({
      email: "john@example.com",
    }).select("+passwordHash");

    expect(user).not.toBeNull();
    expect(user!.name).toBe("John Doe");
    expect(user!.email).toBe("john@example.com");
    expect(user!.plan).toBe("pro");
    expect(user!.passwordHash).not.toBe("password123");
  });

  it("rejects invalid registration data", async () => {
    const request = createJsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: {
        name: "",
        email: "invalid-email",
        password: "short",
        plan: "free",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");

    expect(
      await User.countDocuments({
        email: "invalid-email",
      }),
    ).toBe(0);
  });

  it("rejects an already registered email", async () => {
    const data = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      plan: "free",
    };

    const firstRequest = createJsonRequest(
      "http://localhost/api/auth/register",
      {
        method: "POST",
        body: data,
      },
    );

    const firstResponse = await POST(firstRequest);

    expect(firstResponse.status).toBe(201);

    const secondRequest = createJsonRequest(
      "http://localhost/api/auth/register",
      {
        method: "POST",
        body: {
          ...data,
          name: "Another Name",
        },
      },
    );

    const secondResponse = await POST(secondRequest);

    expect(secondResponse.status).toBe(409);

    const body = await secondResponse.json();

    expect(body.message).toBe("User already exists");

    expect(
      await User.countDocuments({
        email: data.email,
      }),
    ).toBe(1);
  });

  it("rejects an invalid plan", async () => {
    const request = createJsonRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        plan: "enterprise",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");

    expect(
      await User.countDocuments({
        email: "john@example.com",
      }),
    ).toBe(0);
  });
});
