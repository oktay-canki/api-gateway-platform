import type { HydratedDocument } from "mongoose";
import type { IApiDocument } from "./api.document";
import type { ApiResponse } from "./api.types";

export function toApiResponse(
  api: HydratedDocument<IApiDocument>,
): ApiResponse {
  return {
    id: api._id.toString(),
    name: api.name,
    baseUrl: api.baseUrl,
    status: api.status,
    apiKeyPrefix: api.apiKeyPrefix,
    rateLimit: api.rateLimit,
    allowedMethods: api.allowedMethods,
    timeoutMs: api.timeoutMs,
    retryPolicy: api.retryPolicy,
    createdAt: api.createdAt.toISOString(),
    updatedAt: api.updatedAt.toISOString(),
  };
}
