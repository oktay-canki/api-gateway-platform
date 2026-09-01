import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';

import type { RateLimiter } from '../types/rate-limit/rate-limiter.js';
import type { SlidingWindowRateLimit } from '../types/rate-limit/rate-limit.js';
import type { RateLimitResult } from '../types/rate-limit/rate-limit-result.js';

import { slidingWindowScript } from './script-loader.js';

export class SlidingWindowRateLimiter implements RateLimiter {
  constructor(private readonly redis: Redis) {}

  async check(key: string, config: SlidingWindowRateLimit): Promise<RateLimitResult> {
    const now = Date.now();
    const requestId = randomUUID();

    const result = await this.redis.eval(
      slidingWindowScript,
      1,
      key,
      String(now),
      String(config.windowMs),
      String(config.maxRequests),
      requestId
    );

    const [allowed, limit, remaining, retryAfterMs] = result as [number, number, number, number];

    return {
      allowed: allowed === 1,
      limit,
      remaining,
      ...(retryAfterMs > 0 ? { retryAfterMs } : {}),
    };
  }
}
