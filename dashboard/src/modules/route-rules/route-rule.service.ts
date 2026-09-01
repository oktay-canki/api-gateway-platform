import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import AppError from "@/infrastructure/errors/app-error";
import { Api } from "../apis/api.model";
import { RouteRule } from "./route-rule.model";
import type {
  CreateRouteRuleInput,
  UpdateRouteRuleInput,
} from "./route-rule.validation";

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

    return RouteRule.create({
      apiId: new Types.ObjectId(apiId),
      ...data,
    });
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

    const routeRule = await RouteRule.findOneAndUpdate(
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
}
