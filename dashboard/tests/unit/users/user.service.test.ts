import argon2 from "argon2";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDB } from "@/lib/db";
import AppError from "@/infrastructure/errors/app-error";
import { User } from "@/modules/users/user.model";
import { UserService } from "@/modules/users/user.service";
import { JwtService } from "@/infrastructure/auth/jwt.service";

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn(),
}));

vi.mock("@/modules/users/user.model", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("argon2", () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe("UserService", () => {
  const jwtService = {
    sign: vi.fn(),
  } as unknown as JwtService;

  const service = new UserService(jwtService);

  const userId = new Types.ObjectId();

  const user = {
    _id: userId,
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "hashed-password",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    const data = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    it("creates a user when the email is not already registered", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(User.create).mockResolvedValue(user as never);

      const result = await service.register(data);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(User.findOne).toHaveBeenCalledWith({
        email: data.email,
      });

      expect(User.create).toHaveBeenCalledWith({
        name: data.name,
        email: data.email,
        passwordHash: data.password,
      });

      expect(result).toBe(user);
    });

    it("throws 409 when the email is already registered", async () => {
      vi.mocked(User.findOne).mockResolvedValue(user as never);

      await expect(service.register(data)).rejects.toEqual(
        new AppError("User already exists", 409),
      );

      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const data = {
      email: "john@example.com",
      password: "password123",
    };

    it("throws 400 when the user does not exist", async () => {
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      } as never);

      await expect(service.login(data)).rejects.toEqual(
        new AppError("Invalid email or password", 400),
      );

      expect(argon2.verify).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("throws 400 when the password is invalid", async () => {
      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(user),
      } as never);

      vi.mocked(argon2.verify).mockResolvedValue(false);

      await expect(service.login(data)).rejects.toEqual(
        new AppError("Invalid email or password", 400),
      );

      expect(argon2.verify).toHaveBeenCalledWith(
        user.passwordHash,
        data.password,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("returns the user and JWT when credentials are valid", async () => {
      const token = "jwt-token";

      vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(user),
      } as never);

      vi.mocked(argon2.verify).mockResolvedValue(true);
      vi.mocked(jwtService.sign).mockResolvedValue(token);

      const result = await service.login(data);

      expect(User.findOne).toHaveBeenCalledWith({
        email: data.email,
      });

      expect(argon2.verify).toHaveBeenCalledWith(
        user.passwordHash,
        data.password,
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: userId.toString(),
      });

      expect(result).toEqual({
        user,
        token,
      });
    });
  });

  describe("findById", () => {
    it("returns the user by ID", async () => {
      vi.mocked(User.findById).mockResolvedValue(user as never);

      const result = await service.findById(userId.toString());

      expect(connectDB).toHaveBeenCalledOnce();

      expect(User.findById).toHaveBeenCalledWith(userId.toString());

      expect(result).toBe(user);
    });
  });
});
