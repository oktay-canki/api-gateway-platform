import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDB } from "@/lib/db";
import AppError from "@/infrastructure/errors/app-error";
import { RouteRuleService } from "@/modules/route-rules/route-rule.service";
import { Api } from "@/modules/apis/api.model";
import { RouteRule } from "@/modules/route-rules/route-rule.model";

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn(),
}));

vi.mock("@/modules/apis/api.model", () => ({
  Api: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/modules/route-rules/route-rule.model", () => ({
  RouteRule: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

describe("RouteRuleService", () => {
  const service = new RouteRuleService();

  const userId = new Types.ObjectId().toString();
  const apiId = new Types.ObjectId().toString();
  const routeRuleId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    const data = {
      routePattern: "/users/:id",
      rateLimit: {
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

    it("creates a route rule for a user's API", async () => {
      const api = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      const routeRule = {
        _id: new Types.ObjectId(routeRuleId),
        apiId: new Types.ObjectId(apiId),
        ...data,
      };

      vi.mocked(Api.findOne).mockResolvedValue(api as never);
      vi.mocked(RouteRule.create).mockResolvedValue(routeRule as never);

      const result = await service.create(userId, apiId, data);

      expect(connectDB).toHaveBeenCalledOnce();

      expect(Api.findOne).toHaveBeenCalledWith({
        _id: apiId,
        userId,
      });

      expect(RouteRule.create).toHaveBeenCalledWith({
        apiId: new Types.ObjectId(apiId),
        ...data,
      });

      expect(result).toBe(routeRule);
    });

    it("throws 404 when the API does not belong to the user", async () => {
      vi.mocked(Api.findOne).mockResolvedValue(null);

      await expect(service.create(userId, apiId, data)).rejects.toEqual(
        new AppError("API not found", 404),
      );

      expect(RouteRule.create).not.toHaveBeenCalled();
    });
  });

  describe("findAllByApi", () => {
    it("returns route rules for a user's API sorted by newest first", async () => {
      const api = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      const routeRules = [
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ];

      const sort = vi.fn().mockResolvedValue(routeRules);

      vi.mocked(Api.findOne).mockResolvedValue(api as never);

      vi.mocked(RouteRule.find).mockReturnValue({
        sort,
      } as never);

      const result = await service.findAllByApi(userId, apiId);

      expect(Api.findOne).toHaveBeenCalledWith({
        _id: apiId,
        userId,
      });

      expect(RouteRule.find).toHaveBeenCalledWith({
        apiId,
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(result).toBe(routeRules);
    });
  });

  describe("findById", () => {
    it("finds a route rule belonging to the user's API", async () => {
      const api = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      const routeRule = {
        _id: new Types.ObjectId(routeRuleId),
        apiId: new Types.ObjectId(apiId),
        routePattern: "/users/:id",
      };

      vi.mocked(Api.findOne).mockResolvedValue(api as never);
      vi.mocked(RouteRule.findOne).mockResolvedValue(routeRule as never);

      const result = await service.findById(userId, apiId, routeRuleId);

      expect(Api.findOne).toHaveBeenCalledWith({
        _id: apiId,
        userId,
      });

      expect(RouteRule.findOne).toHaveBeenCalledWith({
        _id: routeRuleId,
        apiId,
      });

      expect(result).toBe(routeRule);
    });

    it("throws 404 when the route rule does not exist", async () => {
      vi.mocked(Api.findOne).mockResolvedValue({
        _id: new Types.ObjectId(apiId),
      } as never);

      vi.mocked(RouteRule.findOne).mockResolvedValue(null);

      await expect(
        service.findById(userId, apiId, routeRuleId),
      ).rejects.toEqual(new AppError("Route rule not found", 404));
    });
  });

  describe("update", () => {
    it("updates a route rule belonging to the user's API", async () => {
      const data = {
        routePattern: "/users/:userId",
        timeoutMs: 10_000,
      };

      const api = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      const updatedRouteRule = {
        _id: new Types.ObjectId(routeRuleId),
        apiId: new Types.ObjectId(apiId),
        ...data,
      };

      vi.mocked(Api.findOne).mockResolvedValue(api as never);
      vi.mocked(RouteRule.findOneAndUpdate).mockResolvedValue(
        updatedRouteRule as never,
      );

      const result = await service.update(userId, apiId, routeRuleId, data);

      expect(RouteRule.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: routeRuleId,
          apiId,
        },
        {
          $set: data,
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      );

      expect(result).toBe(updatedRouteRule);
    });

    it("throws 404 when the route rule does not exist", async () => {
      vi.mocked(Api.findOne).mockResolvedValue({
        _id: new Types.ObjectId(apiId),
      } as never);

      vi.mocked(RouteRule.findOneAndUpdate).mockResolvedValue(null);

      await expect(
        service.update(userId, apiId, routeRuleId, {
          timeoutMs: 10_000,
        }),
      ).rejects.toEqual(new AppError("Route rule not found", 404));
    });
  });

  describe("delete", () => {
    it("deletes a route rule belonging to the user's API", async () => {
      const api = {
        _id: new Types.ObjectId(apiId),
        userId: new Types.ObjectId(userId),
      };

      const routeRule = {
        _id: new Types.ObjectId(routeRuleId),
        apiId: new Types.ObjectId(apiId),
      };

      vi.mocked(Api.findOne).mockResolvedValue(api as never);
      vi.mocked(RouteRule.findOneAndDelete).mockResolvedValue(
        routeRule as never,
      );

      const result = await service.delete(userId, apiId, routeRuleId);

      expect(RouteRule.findOneAndDelete).toHaveBeenCalledWith({
        _id: routeRuleId,
        apiId,
      });

      expect(result).toBe(routeRule);
    });

    it("throws 404 when the route rule does not exist", async () => {
      vi.mocked(Api.findOne).mockResolvedValue({
        _id: new Types.ObjectId(apiId),
      } as never);

      vi.mocked(RouteRule.findOneAndDelete).mockResolvedValue(null);

      await expect(service.delete(userId, apiId, routeRuleId)).rejects.toEqual(
        new AppError("Route rule not found", 404),
      );
    });
  });
});
