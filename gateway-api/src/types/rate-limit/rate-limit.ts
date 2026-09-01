export type RateLimitAlgorithm = 'sliding-window' | 'token-bucket';

export interface SlidingWindowRateLimit {
  algorithm: 'sliding-window';
  maxRequests: number;
  windowMs: number;
}

export interface TokenBucketRateLimit {
  algorithm: 'token-bucket';
  capacity: number;
  refillRate: number;
  refillIntervalMs: number;
}

export type RateLimit = SlidingWindowRateLimit | TokenBucketRateLimit;

export type ApiRateLimit = { enabled: boolean } & RateLimit;
