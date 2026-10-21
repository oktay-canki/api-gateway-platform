import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import AppError from "@/infrastructure/errors/app-error";
import { Api } from "../apis/api.model";
import { RouteRule } from "./route-rule.model";
import { validateRateLimitPlan } from "@/modules/subscriptions/plan-rules";
import type {
  CreateRouteRuleInput,
  UpdateRouteRuleInput,
} from "./route-rule.validation";
import { User } from "@/modules/users/user.model";

export class RouteRuleService {
  private async findUserApi(userId: string, apiId: string) {
    const api = await Api.findOne({
      _id: apiId,
      userId,
    });

    if (!api) {
      throw new AppError("API not found", 404);
    }

    return api;
  }

  async create(userId: string, apiId: string, data: CreateRouteRuleInput) {
    await connectDB();

    await this.findUserApi(userId, apiId);

    const user = await User.findById(userId).select("plan");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    validateRateLimitPlan(user.plan, data.rateLimit);

    try {
      return await RouteRule.create({
        apiId: new Types.ObjectId(apiId),
        ...data,
      });
    } catch (error) {
      this.handleDuplicateRoutePattern(error);
    }
  }

  async findAllByApi(userId: string, apiId: string) {
    await connectDB();

    await this.findUserApi(userId, apiId);

    return RouteRule.find({
      apiId,
    }).sort({
      createdAt: -1,
    });
  }

  async findById(userId: string, apiId: string, routeRuleId: string) {
    await connectDB();

    await this.findUserApi(userId, apiId);

    const routeRule = await RouteRule.findOne({
      _id: routeRuleId,
      apiId,
    });

    if (!routeRule) {
      throw new AppError("Route rule not found", 404);
    }

    return routeRule;
  }

  async update(
    userId: string,
    apiId: string,
    routeRuleId: string,
    data: UpdateRouteRuleInput,
  ) {
    await connectDB();

    await this.findUserApi(userId, apiId);

    const user = await User.findById(userId).select("plan");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    validateRateLimitPlan(user.plan, data.rateLimit ?? undefined);

    const removableFields = [
      "rateLimit",
      "allowedMethods",
      "timeoutMs",
      "retryPolicy",
    ] as const;

    const setData: Record<string, unknown> = {};
    const unsetData: Record<string, 1> = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        removableFields.includes(key as (typeof removableFields)[number]) &&
        value === null
      ) {
        unsetData[key] = 1;
      } else {
        setData[key] = value;
      }
    }

    const update: Record<string, unknown> = {};

    if (Object.keys(setData).length > 0) {
      update.$set = setData;
    }

    if (Object.keys(unsetData).length > 0) {
      update.$unset = unsetData;
    }

    let routeRule;

    try {
      routeRule = await RouteRule.findOneAndUpdate(
        {
          _id: routeRuleId,
          apiId,
        },
        update,
        {
          returnDocument: "after",
          runValidators: true,
        },
      );
    } catch (error) {
      this.handleDuplicateRoutePattern(error);
    }

    if (!routeRule) {
      throw new AppError("Route rule not found", 404);
    }

    return routeRule;
  }

  async delete(userId: string, apiId: string, routeRuleId: string) {
    await connectDB();

    await this.findUserApi(userId, apiId);

    const routeRule = await RouteRule.findOneAndDelete({
      _id: routeRuleId,
      apiId,
    });

    if (!routeRule) {
      throw new AppError("Route rule not found", 404);
    }

    return routeRule;
  }

  private handleDuplicateRoutePattern(error: unknown): never {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "A route rule with this pattern already exists for this API",
        409,
      );
    }

    throw error;
  }
}
