import type { Redis } from 'ioredis';
import type { RateLimiter } from '../types/rate-limit/rate-limiter.js';
import type { TokenBucketRateLimit } from '../types/rate-limit/rate-limit.js';
import type { RateLimitResult } from '../types/rate-limit/rate-limit-result.js';
import { tokenBucketScript } from './script-loader.js';

export class TokenBucketRateLimiter implements RateLimiter {
  constructor(private readonly redis: Redis) {}

  async check(key: string, config: TokenBucketRateLimit): Promise<RateLimitResult> {
    const now = Date.now();

    const result = await this.redis.eval(
      tokenBucketScript,
      1,
      key,
      String(now),
      String(config.capacity),
      String(config.refillRate),
      String(config.refillIntervalMs)
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
