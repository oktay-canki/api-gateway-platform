import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import type { CreateRouteRuleInput } from "@/modules/route-rules/route-rule.validation";

import { Api } from "@/modules/apis/api.model";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { RouteRuleService } from "@/modules/route-rules/route-rule.service";
import { User } from "@/modules/users/user.model";
import { buildApiKeyFields, buildApiPayload } from "../../helpers/api";
import { createUser } from "../../helpers/user";

describe("RouteRuleService integration", () => {
  const service = new RouteRuleService();

  let userId: string;
  let otherUserId: string;

  const createRouteRuleData = (
    overrides: Partial<CreateRouteRuleInput> = {},
  ): CreateRouteRuleInput => ({
    routePattern: "/users/:id",
    rateLimit: {
      algorithm: "sliding-window",
      maxRequests: 50,
      windowMs: 60_000,
    },
    allowedMethods: ["GET"],
    timeoutMs: 3_000,
    retryPolicy: {
      enabled: true,
      maxRetries: 2,
      retryDelayMs: 500,
    },
    ...overrides,
  });

  beforeEach(async () => {
    await RouteRule.deleteMany({});
    await Api.deleteMany({});
    await User.deleteMany({});

    const user = await createUser();
    const otherUser = await createUser();

    userId = user._id.toString();
    otherUserId = otherUser._id.toString();
  });

  describe("create", () => {
    it("creates and persists a route rule for the user's API", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const result = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData(),
      );

      expect(result._id).toBeInstanceOf(Types.ObjectId);
      expect(result.apiId.toString()).toBe(api._id.toString());
      expect(result.routePattern).toBe("/users/:id");

      const storedRule = await RouteRule.findById(result._id);

      expect(storedRule).not.toBeNull();
      expect(storedRule!.apiId.toString()).toBe(api._id.toString());
      expect(storedRule!.routePattern).toBe("/users/:id");
    });

    it("rejects creation when the API does not belong to the user", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(otherUserId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      await expect(
        service.create(userId, api._id.toString(), createRouteRuleData()),
      ).rejects.toMatchObject({
        message: "API not found",
        statusCode: 404,
      });

      expect(await RouteRule.countDocuments()).toBe(0);
    });

    it("rejects token-bucket rate limiting for a Free user", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      await expect(
        service.create(
          userId,
          api._id.toString(),
          createRouteRuleData({
            rateLimit: {
              algorithm: "token-bucket",
              capacity: 100,
              refillRate: 10,
              refillIntervalMs: 1_000,
            },
          }),
        ),
      ).rejects.toMatchObject({
        message: "Token bucket rate limiting requires a Pro plan.",
        statusCode: 403,
      });

      expect(await RouteRule.countDocuments()).toBe(0);
    });

    it("allows token-bucket rate limiting for a Pro user", async () => {
      const user = await User.findByIdAndUpdate(
        userId,
        { plan: "pro" },
        { returnDocument: "after" },
      );

      expect(user).not.toBeNull();

      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const result = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData({
          rateLimit: {
            algorithm: "token-bucket",
            capacity: 100,
            refillRate: 10,
            refillIntervalMs: 1_000,
          },
        }),
      );

      expect(result.rateLimit?.algorithm).toBe("token-bucket");
    });
  });

  describe("findAllByApi", () => {
    it("returns route rules belonging to the user's API", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData({
          routePattern: "/users",
        }),
      );

      await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData({
          routePattern: "/users/:id",
        }),
      );

      const result = await service.findAllByApi(userId, api._id.toString());

      expect(result).toHaveLength(2);
      expect(
        result.every((rule) => rule.apiId.toString() === api._id.toString()),
      ).toBe(true);
    });

    it("rejects access when the API belongs to another user", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(otherUserId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      await expect(
        service.findAllByApi(userId, api._id.toString()),
      ).rejects.toMatchObject({
        message: "API not found",
        statusCode: 404,
      });
    });
  });

  describe("findById", () => {
    it("returns a route rule belonging to the user's API", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData(),
      );

      const result = await service.findById(
        userId,
        api._id.toString(),
        routeRule._id.toString(),
      );

      expect(result._id.toString()).toBe(routeRule._id.toString());
      expect(result.apiId.toString()).toBe(api._id.toString());
    });

    it("does not allow another user to access the route rule", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData(),
      );

      await expect(
        service.findById(
          otherUserId,
          api._id.toString(),
          routeRule._id.toString(),
        ),
      ).rejects.toMatchObject({
        message: "API not found",
        statusCode: 404,
      });
    });
  });

  describe("update", () => {
    it("updates and persists a route rule", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData(),
      );

      const result = await service.update(
        userId,
        api._id.toString(),
        routeRule._id.toString(),
        {
          routePattern: "/users/:userId",
          timeoutMs: 10_000,
        },
      );

      expect(result.routePattern).toBe("/users/:userId");
      expect(result.timeoutMs).toBe(10_000);

      const storedRule = await RouteRule.findById(routeRule._id);

      expect(storedRule!.routePattern).toBe("/users/:userId");
      expect(storedRule!.timeoutMs).toBe(10_000);
    });

    it("rejects updating a route rule that does not belong to the API", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await RouteRule.create({
        apiId: api._id,
        ...createRouteRuleData(),
      });

      await expect(
        service.update(
          userId,
          api._id.toString(),
          new Types.ObjectId().toString(),
          {
            routePattern: "/different",
          },
        ),
      ).rejects.toMatchObject({
        message: "Route rule not found",
        statusCode: 404,
      });

      expect(routeRule.routePattern).toBe("/users/:id");
    });

    it("rejects token-bucket rate limiting for a Free user", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData(),
      );

      await expect(
        service.update(userId, api._id.toString(), routeRule._id.toString(), {
          rateLimit: {
            algorithm: "token-bucket",
            capacity: 100,
            refillRate: 10,
            refillIntervalMs: 1_000,
          },
        }),
      ).rejects.toMatchObject({
        message: "Token bucket rate limiting requires a Pro plan.",
        statusCode: 403,
      });
    });
  });

  describe("delete", () => {
    it("deletes a route rule and removes it from the database", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(userId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await service.create(
        userId,
        api._id.toString(),
        createRouteRuleData(),
      );

      const result = await service.delete(
        userId,
        api._id.toString(),
        routeRule._id.toString(),
      );

      expect(result._id.toString()).toBe(routeRule._id.toString());

      const storedRule = await RouteRule.findById(routeRule._id);

      expect(storedRule).toBeNull();
    });

    it("rejects deleting a route rule when the API belongs to another user", async () => {
      const api = await Api.create({
        userId: new Types.ObjectId(otherUserId),
        ...buildApiPayload(),
        ...buildApiKeyFields(),
      });

      const routeRule = await RouteRule.create({
        apiId: api._id,
        ...createRouteRuleData(),
      });

      await expect(
        service.delete(userId, api._id.toString(), routeRule._id.toString()),
      ).rejects.toMatchObject({
        message: "API not found",
        statusCode: 404,
      });

      expect(await RouteRule.exists({ _id: routeRule._id })).not.toBeNull();
    });
  });
});
