import ITimestamps from "@/interfaces/ITimestamps";
import { Schema, Types } from "mongoose";

export const RATE_LIMIT_ALGORITHMS = [
  "sliding-window",
  "token-bucket",
] as const;

export type RateLimitAlgorithm = (typeof RATE_LIMIT_ALGORITHMS)[number];

export interface ISlidingWindowRateLimit {
  algorithm: "sliding-window";
  maxRequests: number;
  windowMs: number;
}

export interface ITokenBucketRateLimit {
  algorithm: "token-bucket";
  capacity: number;
  refillRate: number;
  refillIntervalMs: number;
}

export type RateLimit = ISlidingWindowRateLimit | ITokenBucketRateLimit;
export type ApiRateLimit = { enabled: boolean } & RateLimit;

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
] as const;

const DEFAULT_ALLOWED_METHODS = [...HTTP_METHODS];

export type HttpMethod = (typeof HTTP_METHODS)[number];

export type RetryPolicy = {
  maxRetries: number;
  retryDelayMs: number;
};
export type ApiRetryPolicy = {
  enabled: boolean;
} & RetryPolicy;

export const API_STATUSES = ["active", "revoked"] as const;

export type ApiStatus = (typeof API_STATUSES)[number];

export interface IApi extends ITimestamps {
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

const rateLimitSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    algorithm: {
      type: String,
      enum: RATE_LIMIT_ALGORITHMS,
      required: true,
    },

    // Sliding window
    maxRequests: {
      type: Number,
      min: 1,
    },

    windowMs: {
      type: Number,
      min: 1,
    },

    // Token bucket
    capacity: {
      type: Number,
      min: 1,
    },

    refillRate: {
      type: Number,
      min: 1,
    },

    refillIntervalMs: {
      type: Number,
      min: 1,
    },
  },
  {
    _id: false,
  },
);

export const apiSchema = new Schema<IApi>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    baseUrl: {
      type: String,
      required: true,
      trim: true,
    },

    apiKeyHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    apiKeyPrefix: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: API_STATUSES,
      default: "active",
      required: true,
      index: true,
    },

    rateLimit: {
      type: rateLimitSchema,
      required: true,
    },

    allowedMethods: {
      type: [String],
      enum: HTTP_METHODS,
      default: DEFAULT_ALLOWED_METHODS,
    },

    timeoutMs: {
      type: Number,
      required: true,
      min: 1,
      default: 10_000,
    },

    retryPolicy: {
      enabled: {
        type: Boolean,
        default: false,
      },

      maxRetries: {
        type: Number,
        min: 0,
        max: 5,
        default: 3,
      },

      retryDelayMs: {
        type: Number,
        min: 0,
        default: 500,
      },
    },
  },
  {
    timestamps: true,
  },
);

apiSchema.index({ userId: 1, baseUrl: 1 }, { unique: true });
