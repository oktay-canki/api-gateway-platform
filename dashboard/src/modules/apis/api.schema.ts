import { Schema } from "mongoose";
import { API_STATUSES, HTTP_METHODS, RATE_LIMIT_ALGORITHMS } from "./api.types";
import type { IApiDocument } from "./api.document";

const DEFAULT_ALLOWED_METHODS = [...HTTP_METHODS];

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

export const apiSchema = new Schema<IApiDocument>(
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
