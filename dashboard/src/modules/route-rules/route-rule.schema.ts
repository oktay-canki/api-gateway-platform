import { Schema } from "mongoose";

import { HTTP_METHODS, RATE_LIMIT_ALGORITHMS } from "@/modules/apis/api.types";
import type { IRouteRuleDocument } from "./route-rule.document";

const rateLimitSchema = new Schema(
  {
    algorithm: {
      type: String,
      enum: RATE_LIMIT_ALGORITHMS,
      required: true,
    },

    maxRequests: {
      type: Number,
      min: 1,
    },

    windowMs: {
      type: Number,
      min: 1,
    },

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

const retryPolicySchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    maxRetries: {
      type: Number,
      min: 0,
      max: 5,
    },

    retryDelayMs: {
      type: Number,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

export const routeRuleSchema = new Schema<IRouteRuleDocument>(
  {
    apiId: {
      type: Schema.Types.ObjectId,
      ref: "Api",
      required: true,
      index: true,
    },

    routePattern: {
      type: String,
      required: true,
      trim: true,
    },

    rateLimit: {
      type: rateLimitSchema,
    },

    allowedMethods: {
      type: [String],
      enum: HTTP_METHODS,
      default: undefined,
    },

    timeoutMs: {
      type: Number,
      min: 1,
    },

    retryPolicy: {
      type: retryPolicySchema,
    },
  },
  {
    timestamps: true,
  },
);

routeRuleSchema.index({ apiId: 1, routePattern: 1 }, { unique: true });
