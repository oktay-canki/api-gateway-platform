import type ITimestamps from "@/interfaces/ITimestamps";
import type {
  ApiRateLimit,
  ApiRetryPolicy,
  ApiStatus,
  HttpMethod,
} from "./api.types";
import type { Types } from "mongoose";

export interface IApiDocument extends ITimestamps {
  userId: Types.ObjectId;

  name: string;
  baseUrl: string;

  apiKeyHash: string;
  apiKeyPrefix: string;
  status: ApiStatus;

  rateLimit: ApiRateLimit;

  allowedMethods: HttpMethod[];

  timeoutMs: number;

  retryPolicy: ApiRetryPolicy;
}
