import { Types } from "mongoose";
import { describe, expect, it } from "vitest";

import { toApiResponse } from "@/modules/apis/api.mapper";

type ApiMapperInput = {
  _id: Types.ObjectId;
  name: string;
  baseUrl: string;
  rateLimit:
    | {
        enabled: boolean;
        algorithm: "sliding-window";
        maxRequests: number;
        windowMs: number;
      }
    | {
        enabled: boolean;
        algorithm: "token-bucket";
        capacity: number;
        refillRate: number;
        refillIntervalMs: number;
      };
  allowedMethods: string[];
  timeoutMs: number;
  retryPolicy: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

describe("toApiResponse", () => {
  it("maps an API document to a response object", () => {
    const id = new Types.ObjectId();

    const createdAt = new Date("2026-08-18T10:00:00.000Z");
    const updatedAt = new Date("2026-08-18T11:00:00.000Z");

    const api: ApiMapperInput = {
      _id: id,
      name: "Users API",
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
        maxRetries: 3,
        retryDelayMs: 500,
      },
      createdAt,
      updatedAt,
    };

    const result = toApiResponse(api as Parameters<typeof toApiResponse>[0]);

    expect(result).toEqual({
      id: id.toString(),
      name: "Users API",
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
        maxRetries: 3,
        retryDelayMs: 500,
      },
      createdAt,
      updatedAt,
    });
  });

  it("maps a token-bucket rate limit correctly", () => {
    const api: ApiMapperInput = {
      _id: new Types.ObjectId(),
      name: "Orders API",
      baseUrl: "https://api.example.com/orders",
      rateLimit: {
        enabled: false,
        algorithm: "token-bucket",
        capacity: 100,
        refillRate: 10,
        refillIntervalMs: 1_000,
      },
      allowedMethods: ["GET"],
      timeoutMs: 10_000,
      retryPolicy: {
        enabled: false,
        maxRetries: 3,
        retryDelayMs: 500,
      },
      createdAt: new Date("2026-08-18T10:00:00.000Z"),
      updatedAt: new Date("2026-08-18T11:00:00.000Z"),
    };

    const result = toApiResponse(api as Parameters<typeof toApiResponse>[0]);

    expect(result.rateLimit).toEqual({
      enabled: false,
      algorithm: "token-bucket",
      capacity: 100,
      refillRate: 10,
      refillIntervalMs: 1_000,
    });

    expect(result.id).toBe(api._id.toString());
  });
});
