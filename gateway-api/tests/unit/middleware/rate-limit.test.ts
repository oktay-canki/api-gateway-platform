import { describe, expect, it, vi } from 'vitest';
import { createRateLimitMiddleware } from '../../../src/middleware/rate-limit.js';
import type { RateLimiter } from '../../../src/types/rate-limit/rate-limiter.js';
import { createApiConfig } from '../../helpers/api.js';
import { createNext, createRequest, createResponse } from '../../helpers/express.js';

describe('rateLimit', () => {
  it('calls next when no rate limit is configured', async () => {
    const slidingWindowRateLimiter: RateLimiter = {
      check: vi.fn(),
    };

    const tokenBucketRateLimiter: RateLimiter = {
      check: vi.fn(),
    };

    const middleware = createRateLimitMiddleware({
      'sliding-window': slidingWindowRateLimiter,
      'token-bucket': tokenBucketRateLimiter,
    });

    const gatewayConfig = createApiConfig([]);

    const req = createRequest({
      path: '/users/123',
      method: 'GET',
      gatewayConfig,
    });

    req.resolvedRouteConfig = {
      ...gatewayConfig.api,
      rateLimit: undefined,
      params: {},
    };

    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(slidingWindowRateLimiter.check).not.toHaveBeenCalled();
    expect(tokenBucketRateLimiter.check).not.toHaveBeenCalled();
  });

  it('calls next when the request is allowed', async () => {
    const slidingWindowRateLimiter: RateLimiter = {
      check: vi.fn().mockResolvedValue({
        allowed: true,
        limit: 5,
        remaining: 4,
      }),
    };

    const tokenBucketRateLimiter: RateLimiter = {
      check: vi.fn(),
    };

    const middleware = createRateLimitMiddleware({
      'sliding-window': slidingWindowRateLimiter,
      'token-bucket': tokenBucketRateLimiter,
    });

    const gatewayConfig = createApiConfig([]);

    const req = createRequest({
      path: '/users/123',
      method: 'GET',
      gatewayConfig,
    });

    req.resolvedRouteConfig = {
      ...gatewayConfig.api,
      rateLimit: {
        algorithm: 'sliding-window',
        maxRequests: 5,
        windowMs: 10_000,
      },
      params: {},
    };

    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(slidingWindowRateLimiter.check).toHaveBeenCalledOnce();
    expect(tokenBucketRateLimiter.check).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '5');

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');

    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 429 when the request is rate limited', async () => {
    const slidingWindowRateLimiter: RateLimiter = {
      check: vi.fn().mockResolvedValue({
        allowed: false,
        limit: 5,
        remaining: 0,
        retryAfterMs: 3000,
      }),
    };

    const tokenBucketRateLimiter: RateLimiter = {
      check: vi.fn(),
    };

    const middleware = createRateLimitMiddleware({
      'sliding-window': slidingWindowRateLimiter,
      'token-bucket': tokenBucketRateLimiter,
    });

    const gatewayConfig = createApiConfig([]);

    const req = createRequest({
      path: '/users/123',
      method: 'GET',
      gatewayConfig,
    });

    req.resolvedRouteConfig = {
      ...gatewayConfig.api,
      rateLimit: {
        algorithm: 'sliding-window',
        maxRequests: 5,
        windowMs: 10_000,
      },
      params: {},
    };

    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(slidingWindowRateLimiter.check).toHaveBeenCalledOnce();
    expect(tokenBucketRateLimiter.check).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(429);

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '5');

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');

    expect(res.set).toHaveBeenCalledWith('Retry-After', '3');

    expect(res.json).toHaveBeenCalledWith({
      error: 'Too many requests',
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('uses the token bucket limiter when configured', async () => {
    const slidingWindowRateLimiter: RateLimiter = {
      check: vi.fn(),
    };

    const tokenBucketRateLimiter: RateLimiter = {
      check: vi.fn().mockResolvedValue({
        allowed: true,
        limit: 10,
        remaining: 9,
      }),
    };

    const middleware = createRateLimitMiddleware({
      'sliding-window': slidingWindowRateLimiter,
      'token-bucket': tokenBucketRateLimiter,
    });

    const gatewayConfig = createApiConfig([]);

    const req = createRequest({
      path: '/users/123',
      method: 'GET',
      gatewayConfig,
    });

    req.resolvedRouteConfig = {
      ...gatewayConfig.api,
      rateLimit: {
        algorithm: 'token-bucket',
        capacity: 10,
        refillRate: 1,
        refillIntervalMs: 1000,
      },
      params: {},
    };

    const res = createResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(tokenBucketRateLimiter.check).toHaveBeenCalledOnce();
    expect(slidingWindowRateLimiter.check).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
});
