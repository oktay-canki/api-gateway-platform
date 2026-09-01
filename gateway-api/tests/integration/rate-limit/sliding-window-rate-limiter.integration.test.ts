import { describe, expect, it } from 'vitest';

import { redisClient } from '../../../src/lib/redis.js';
import { SlidingWindowRateLimiter } from '../../../src/rate-limit/sliding-window-rate-limiter.js';

describe('SlidingWindowRateLimiter', () => {
  const limiter = new SlidingWindowRateLimiter(redisClient);

  const config = {
    enabled: true,
    algorithm: 'sliding-window' as const,
    maxRequests: 3,
    windowMs: 100,
  };

  it('allows requests under the limit', async () => {
    const key = 'test:rate-limit:under-limit';

    const result1 = await limiter.check(key, config);
    const result2 = await limiter.check(key, config);
    const result3 = await limiter.check(key, config);

    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);

    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('rejects requests over the limit', async () => {
    const key = 'test:rate-limit:over-limit';

    await limiter.check(key, config);
    await limiter.check(key, config);
    await limiter.check(key, config);

    const result = await limiter.check(key, config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('allows requests again after previous requests expire', async () => {
    const key = 'test:rate-limit:expired';

    await limiter.check(key, config);
    await limiter.check(key, config);
    await limiter.check(key, config);

    const rejected = await limiter.check(key, config);

    expect(rejected.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 120));

    const result = await limiter.check(key, config);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });
});
