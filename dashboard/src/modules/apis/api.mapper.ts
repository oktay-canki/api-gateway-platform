import type { HydratedDocument } from "mongoose";
import type { IApi } from "./api.schema";

export function toApiResponse(api: HydratedDocument<IApi>) {
  return {
    id: api._id.toString(),
    name: api.name,
    baseUrl: api.baseUrl,
    rateLimit: api.rateLimit,
    allowedMethods: api.allowedMethods,
    timeoutMs: api.timeoutMs,
    retryPolicy: api.retryPolicy,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}
