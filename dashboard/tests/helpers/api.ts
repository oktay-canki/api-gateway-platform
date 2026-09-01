import { Api } from "@/modules/apis/api.model";
import { IApi } from "@/modules/apis/api.schema";
import { CreateApiInput } from "@/modules/apis/api.validation";
import { HydratedDocument, Types } from "mongoose";
import { createApiKey, hashApiKey } from "@/lib/crypto";

export function buildApiKeyFields() {
  const rawKey = "gw_live_" + createApiKey();
  return {
    apiKeyHash: hashApiKey(rawKey),
    apiKeyPrefix: rawKey.slice(0, 14),
  };
}

export function buildApiPayload(
  overrides: Partial<CreateApiInput> = {},
): CreateApiInput {
  return {
    ...buildApiKeyFields(),
    name: "My API",
    baseUrl: "https://api.example.com",
    rateLimit: {
      enabled: true,
      algorithm: "sliding-window",
      maxRequests: 100,
      windowMs: 60_000,
    },
    allowedMethods: ["GET", "POST"],
    timeoutMs: 5_000,
    retryPolicy: {
      enabled: true,
      maxRetries: 2,
      retryDelayMs: 500,
    },
    ...overrides,
  };
}

export async function createApis(
  data: {
    userId: Types.ObjectId;
    name: string;
    baseUrl: string;
    createdAt?: Date;
  }[],
) {
  return Promise.all(
    data.map(async ({ userId, name, baseUrl, createdAt }) => {
      const api = await Api.create({
        userId,
        ...buildApiPayload({ name, baseUrl }),
      });

      if (createdAt) {
        await Api.collection.updateOne(
          { _id: api._id },
          { $set: { createdAt } },
        );

        api.createdAt = createdAt;
      }

      return api;
    }),
  );
}
