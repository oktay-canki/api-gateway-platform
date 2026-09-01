import mongoose, { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDB } from "@/lib/db";
import AppError from "@/infrastructure/errors/app-error";
import { ApiService } from "@/modules/apis/api.service";
import { Api } from "@/modules/apis/api.model";

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  createApiKey: vi.fn(() => "mockedRandomPart"),
  hashApiKey: vi.fn(() => "mockedHash"),
}));

vi.mock("@/modules/apis/api.model", () => ({
  Api: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

describe("ApiService", () => {
  const service = new ApiService();

  const userId = new Types.ObjectId().toString();
  const apiId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
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
        enabled: true,
        maxRetries: 3,
        retryDelayMs: 500,
      },
    };

    it("creates an API for the user", async () => {
      const createdApi = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        ...data,
        apiKeyHash: "mockedHash",
        apiKeyPrefix: "gw_live_mocked",
      };

      vi.mocked(Api.create).mockResolvedValue(createdApi as never);

      const result = await service.create(userId, data);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(Api.create).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
        ...data,
        apiKeyHash: "mockedHash",
        apiKeyPrefix: expect.any(String),
      });

      expect(result).toEqual({
        api: createdApi,
        rawKey: expect.stringContaining("gw_live_"),
      });
    });

    it("throws a conflict error when the base URL is already registered", async () => {
      const duplicateError = new mongoose.mongo.MongoServerError({
        message: "E11000 duplicate key error",
      });

      duplicateError.code = 11000;

      vi.mocked(Api.create).mockRejectedValue(duplicateError);

      await expect(service.create(userId, data)).rejects.toEqual(
        new AppError("An API with this base URL is already registered.", 409),
      );
    });

    it("rethrows non-duplicate errors", async () => {
      const error = new Error("Database connection failed");

      vi.mocked(Api.create).mockRejectedValue(error);

      await expect(service.create(userId, data)).rejects.toBe(error);
    });
  });

  describe("findAllByUserId", () => {
    it("returns the user's APIs sorted by newest first", async () => {
      const apis = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];

      const sort = vi.fn().mockResolvedValue(apis);

      vi.mocked(Api.find).mockReturnValue({
        sort,
      } as never);

      const result = await service.findAllByUserId(userId);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(Api.find).toHaveBeenCalledWith({
        userId,
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(result).toBe(apis);
    });
  });

  describe("findById", () => {
    it("finds an API belonging to the user", async () => {
      const api = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      vi.mocked(Api.findOne).mockResolvedValue(api as never);

      const result = await service.findById(userId, apiId);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(Api.findOne).toHaveBeenCalledWith({
        _id: apiId,
        userId,
      });

      expect(result).toBe(api);
    });
  });

  describe("update", () => {
    it("updates an API belonging to the user", async () => {
      const data = {
        name: "Updated API",
        timeoutMs: 10_000,
      };

      const updatedApi = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
        ...data,
      };

      vi.mocked(Api.findOneAndUpdate).mockResolvedValue(updatedApi as never);

      const result = await service.update(userId, apiId, data);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(Api.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: apiId,
          userId,
        },
        {
          $set: data,
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      expect(result).toBe(updatedApi);
    });
  });

  describe("delete", () => {
    it("deletes an API belonging to the user", async () => {
      const deletedApi = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      vi.mocked(Api.findOneAndDelete).mockResolvedValue(deletedApi as never);

      const result = await service.delete(userId, apiId);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(Api.findOneAndDelete).toHaveBeenCalledWith({
        _id: apiId,
        userId,
      });

      expect(result).toBe(deletedApi);
    });
  });
});
