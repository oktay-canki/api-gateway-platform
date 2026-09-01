import argon2 from "argon2";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { User } from "@/modules/users/user.model";
import { UserService } from "@/modules/users/user.service";
import { JwtService } from "@/infrastructure/auth/jwt.service";

describe("UserService integration", () => {
  const jwtService = {
    sign: vi.fn(),
  } as unknown as JwtService;

  const service = new UserService(jwtService);

  beforeEach(async () => {
    await User.deleteMany({});
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("creates and persists a user with a hashed password", async () => {
      const result = await service.register({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(result._id).toBeInstanceOf(Types.ObjectId);
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");

      // passwordHash should not contain the plain-text password.
      expect(result.passwordHash).not.toBe("password123");

      // Verify the stored hash is a valid Argon2 hash.
      expect(await argon2.verify(result.passwordHash, "password123")).toBe(
        true,
      );

      const storedUser = await User.findOne({
        email: "john@example.com",
      }).select("+passwordHash");

      expect(storedUser).not.toBeNull();
      expect(storedUser!.passwordHash).not.toBe("password123");

      expect(await argon2.verify(storedUser!.passwordHash, "password123")).toBe(
        true,
      );
    });

    it("rejects duplicate email addresses", async () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      await service.register(data);

      await expect(service.register(data)).rejects.toMatchObject({
        message: "User already exists",
        statusCode: 409,
      });

      expect(await User.countDocuments({ email: data.email })).toBe(1);
    });
  });

  describe("login", () => {
    it("authenticates a user with valid credentials", async () => {
      await service.register({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      const token = "test-jwt-token";
      vi.mocked(jwtService.sign).mockResolvedValue(token);

      const result = await service.login({
        email: "john@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("john@example.com");
      expect(result.token).toBe(token);

      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: result.user._id.toString(),
      });
    });

    it("rejects invalid credentials", async () => {
      await service.register({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      await expect(
        service.login({
          email: "john@example.com",
          password: "wrong-password",
        }),
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        statusCode: 400,
      });

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("returns the persisted user by ID", async () => {
      const user = await service.register({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      const result = await service.findById(user._id.toString());

      expect(result).not.toBeNull();
      expect(result!._id.toString()).toBe(user._id.toString());
      expect(result!.email).toBe("john@example.com");
    });
  });
});
