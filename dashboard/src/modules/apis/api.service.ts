import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Api } from "./api.model";
import type { CreateApiInput, UpdateApiInput } from "./api.validation";
import AppError from "@/infrastructure/errors/app-error";
import { createApiKey, hashApiKey } from "@/lib/crypto";

export class ApiService {
  async create(userId: string, data: CreateApiInput) {
    await connectDB();

    try {
      const rawKey = "gw_live_" + createApiKey();
      const apiKeyHash = hashApiKey(rawKey);
      const apiKeyPrefix = rawKey.slice(0, 14);

      const api = await Api.create({
        ...data,
        userId: new Types.ObjectId(userId),
        apiKeyHash,
        apiKeyPrefix,
      });

      return { api, rawKey };
    } catch (error) {
      if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
      ) {
        throw new AppError(
          "An API with this base URL is already registered.",
          409,
        );
      }

      throw error;
    }
  }

  async regenerateApiKey(userId: string, apiId: string) {
    await connectDB();

    const rawKey = "gw_live_" + createApiKey();
    const apiKeyHash = hashApiKey(rawKey);
    const apiKeyPrefix = rawKey.slice(0, 14);

    const api = await Api.findOneAndUpdate(
      {
        _id: apiId,
        userId,
      },
      {
        $set: {
          apiKeyHash,
          apiKeyPrefix,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!api) {
      throw new AppError("API not found.", 404);
    }

    return { api, rawKey };
  }

  async findAllByUserId(userId: string) {
    await connectDB();

    return Api.find({
      userId,
    }).sort({ createdAt: -1 });
  }

  async findById(userId: string, apiId: string) {
    await connectDB();

    return Api.findOne({
      _id: apiId,
      userId,
    });
  }

  async update(userId: string, apiId: string, data: UpdateApiInput) {
    await connectDB();

    return Api.findOneAndUpdate(
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
  }

  async delete(userId: string, apiId: string) {
    await connectDB();

    return Api.findOneAndDelete({
      _id: apiId,
      userId,
    });
  }
}
