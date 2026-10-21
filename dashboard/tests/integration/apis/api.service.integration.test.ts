import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { ApiService } from "@/modules/apis/api.service";
import { Api } from "@/modules/apis/api.model";
import { User } from "@/modules/users/user.model";
import { createApis } from "../../helpers/api";
import { createUser } from "../../helpers/user";

describe("ApiService integration", () => {
  const service = new ApiService();

  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    await Api.deleteMany({});
    await User.deleteMany({});

    const user = await createUser();
    const otherUser = await createUser();

    userId = user._id.toString();
    otherUserId = otherUser._id.toString();
  });

  describe("create", () => {
    it("creates and persists an API", async () => {
      const data = {
        name: "Users API",
        baseUrl: "https://api.example.com",
        rateLimit: {
          enabled: true,
          algorithm: "sliding-window" as const,
          maxRequests: 100,
          windowMs: 60_000,
        },
        allowedMethods: ["GET" as const, "POST" as const],
        timeoutMs: 5_000,
        retryPolicy: {
          enabled: false,
          maxRetries: 3,
          retryDelayMs: 500,
        },
      };

      const { api: result } = await service.create(userId, data);

      expect(result._id).toBeInstanceOf(Types.ObjectId);
      expect(result.userId.toString()).toBe(userId);
      expect(result.name).toBe(data.name);
      expect(result.baseUrl).toBe(data.baseUrl);

      const storedApi = await Api.findById(result._id);

      expect(storedApi).not.toBeNull();
      expect(storedApi!.name).toBe(data.name);
      expect(storedApi!.userId.toString()).toBe(userId);
    });

    it("rejects duplicate base URLs for the same user", async () => {
      const data = {
        name: "Users API",
        baseUrl: "https://api.example.com",
        rateLimit: {
          enabled: true,
          algorithm: "sliding-window" as const,
          maxRequests: 100,
          windowMs: 60_000,
        },
        allowedMethods: ["GET" as const],
        timeoutMs: 5_000,
        retryPolicy: {
          enabled: false,
          maxRetries: 3,
          retryDelayMs: 500,
        },
      };

      await service.create(userId, data);

      await expect(service.create(userId, data)).rejects.toMatchObject({
        message: "An API with this base URL is already registered.",
        statusCode: 409,
      });
    });

    it("allows the same base URL for different users", async () => {
      const data = {
        name: "Users API",
        baseUrl: "https://api.example.com",
        rateLimit: {
          enabled: true,
          algorithm: "sliding-window" as const,
          maxRequests: 100,
          windowMs: 60_000,
        },
        allowedMethods: ["GET" as const],
        timeoutMs: 5_000,
        retryPolicy: {
          enabled: false,
          maxRetries: 3,
          retryDelayMs: 500,
        },
      };

      const { api: first } = await service.create(userId, data);
      const { api: second } = await service.create(otherUserId, data);

      expect(first.userId.toString()).toBe(userId);
      expect(second.userId.toString()).toBe(otherUserId);
    });

    it("rejects token-bucket rate limiting for a Free user", async () => {
      const data = {
        name: "Users API",
        baseUrl: "https://api.example.com",
        rateLimit: {
          enabled: true,
          algorithm: "token-bucket" as const,
          capacity: 100,
          refillRate: 10,
          refillIntervalMs: 1_000,
        },
        allowedMethods: ["GET" as const],
        timeoutMs: 5_000,
        retryPolicy: {
          enabled: false,
          maxRetries: 3,
          retryDelayMs: 500,
        },
      };

      await expect(service.create(userId, data)).rejects.toMatchObject({
        message: "Token bucket rate limiting requires a Pro plan.",
        statusCode: 403,
      });

      expect(await Api.countDocuments()).toBe(0);
    });

    it("allows token-bucket rate limiting for a Pro user", async () => {
      const user = await User.findByIdAndUpdate(
        userId,
        { plan: "pro" },
        { returnDocument: "after" },
      );

      expect(user).not.toBeNull();

      const data = {
        name: "Users API",
        baseUrl: "https://api.example.com",
        rateLimit: {
          enabled: true,
          algorithm: "token-bucket" as const,
          capacity: 100,
          refillRate: 10,
          refillIntervalMs: 1_000,
        },
        allowedMethods: ["GET" as const],
        timeoutMs: 5_000,
        retryPolicy: {
          enabled: false,
          maxRetries: 3,
          retryDelayMs: 500,
        },
      };

      const { api } = await service.create(userId, data);

      expect(api.rateLimit.algorithm).toBe("token-bucket");
    });
  });

  describe("findAllByUserId", () => {
    it("returns only APIs belonging to the user", async () => {
      await createApis([
        {
          userId: new Types.ObjectId(userId),
          name: "API 1",
          baseUrl: "https://api-one.example.com",
        },
        {
          userId: new Types.ObjectId(otherUserId),
          name: "API 2",
          baseUrl: "https://api-two.example.com",
        },
      ]);

      const result = await service.findAllByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("API 1");
      expect(result[0].userId.toString()).toBe(userId);
    });
  });

  describe("findById", () => {
    it("returns an API belonging to the user", async () => {
      const [api] = await createApis([
        {
          userId: new Types.ObjectId(userId),
          name: "Users API",
          baseUrl: "https://api.example.com",
        },
      ]);

      const result = await service.findById(userId, api._id.toString());

      expect(result).not.toBeNull();
      expect(result!._id.toString()).toBe(api._id.toString());
    });

    it("does not return an API belonging to another user", async () => {
      const [api] = await createApis([
        {
          userId: new Types.ObjectId(userId),
          name: "Users API",
          baseUrl: "https://api.example.com",
        },
      ]);

      const result = await service.findById(otherUserId, api._id.toString());

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("updates and persists an API", async () => {
      const [api] = await createApis([
        {
          userId: new Types.ObjectId(userId),
          name: "Users API",
          baseUrl: "https://api.example.com",
        },
      ]);

      const result = await service.update(userId, api._id.toString(), {
        name: "Updated Users API",
        timeoutMs: 10_000,
      });

      expect(result).not.toBeNull();
      expect(result!.name).toBe("Updated Users API");
      expect(result!.timeoutMs).toBe(10_000);

      const storedApi = await Api.findById(api._id);

      expect(storedApi).not.toBeNull();
      expect(storedApi!.name).toBe("Updated Users API");
      expect(storedApi!.timeoutMs).toBe(10_000);
    });
  });

  describe("delete", () => {
    it("deletes an API belonging to the user", async () => {
      const [api] = await createApis([
        {
          userId: new Types.ObjectId(userId),
          name: "Users API",
          baseUrl: "https://api.example.com",
        },
      ]);

      const result = await service.delete(userId, api._id.toString());

      expect(result).not.toBeNull();
      expect(result!._id.toString()).toBe(api._id.toString());

      const storedApi = await Api.findById(api._id);

      expect(storedApi).toBeNull();
    });
  });
});
