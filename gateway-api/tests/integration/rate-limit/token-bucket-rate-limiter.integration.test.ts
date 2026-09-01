import { describe, expect, it } from 'vitest';
import { redisClient } from '../../../src/lib/redis.js';
import { TokenBucketRateLimiter } from '../../../src/rate-limit/token-bucket-rate-limiter.js';
import type { TokenBucketRateLimit } from '../../../src/types/rate-limit/rate-limit.js';

describe('TokenBucketRateLimiter', () => {
  const limiter = new TokenBucketRateLimiter(redisClient);

  const config: TokenBucketRateLimit = {
    algorithm: 'token-bucket',
    capacity: 3,
    refillRate: 1,
    refillIntervalMs: 100,
  };

  it('allows requests while tokens are available', async () => {
    const key = 'test:rate-limit:token-bucket:under-limit';

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

  it('rejects requests when the bucket is empty', async () => {
    const key = 'test:rate-limit:token-bucket:empty';

    await limiter.check(key, config);
    await limiter.check(key, config);
    await limiter.check(key, config);

    const result = await limiter.check(key, config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('allows requests again after tokens are refilled', async () => {
    const key = 'test:rate-limit:token-bucket:refill';

    await limiter.check(key, config);
    await limiter.check(key, config);
    await limiter.check(key, config);

    const rejected = await limiter.check(key, config);

    expect(rejected.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 120));

    const result = await limiter.check(key, config);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });
});
