import { beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/auth/login/route";
import { User } from "@/modules/users/user.model";
import { createJsonRequest } from "../../helpers/request";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    await User.create({
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "password123",
    });
  });

  it("logs in a user with valid credentials", async () => {
    const request = createJsonRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: {
        email: "john@example.com",
        password: "password123",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toMatchObject({
      name: "John Doe",
      email: "john@example.com",
    });

    expect(body.passwordHash).toBeUndefined();

    const cookie = response.headers.get("set-cookie");

    expect(cookie).toBeDefined();
    expect(cookie).toContain("auth-token=");
    expect(cookie).toContain("HttpOnly");
  });

  it("rejects invalid credentials", async () => {
    const request = createJsonRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: {
        email: "john@example.com",
        password: "wrong-password",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.message).toBe("Invalid email or password");

    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects invalid request data", async () => {
    const request = createJsonRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: {
        email: "not-an-email",
        password: "",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toHaveProperty("message");

    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
