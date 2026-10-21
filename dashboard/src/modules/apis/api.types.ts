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

export type ApiRateLimit = {
  enabled: boolean;
} & RateLimit;

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
] as const;

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

export type ApiResponse = {
  id: string;
  name: string;
  baseUrl: string;
  status: ApiStatus;
  apiKeyPrefix: string;
  rateLimit: ApiRateLimit;
  allowedMethods: HttpMethod[];
  timeoutMs: number;
  retryPolicy: ApiRetryPolicy;
  createdAt: string;
  updatedAt: string;
};
