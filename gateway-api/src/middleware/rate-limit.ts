import type { NextFunction, Request, Response } from 'express';

import type { RateLimiter } from '../types/rate-limit/rate-limiter.js';
import type { RateLimitAlgorithm } from '../types/rate-limit/rate-limit.js';

import { createRateLimitKey } from '../rate-limit/create-rate-limit-key.js';

export function createRateLimitMiddleware(rateLimiters: Record<RateLimitAlgorithm, RateLimiter>) {
  return async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    const config = req.resolvedRouteConfig;

    if (!config?.rateLimit) {
      next();
      return;
    }

    const key = createRateLimitKey(config);

    const limiter = rateLimiters[config.rateLimit.algorithm];

    try {
      const result = await limiter.check(key, config.rateLimit);

      res.set('X-RateLimit-Limit', String(result.limit));
      res.set('X-RateLimit-Remaining', String(result.remaining));

      if (!result.allowed) {
        if (result.retryAfterMs !== undefined) {
          res.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
        }

        res.status(429).json({
          error: 'Too many requests',
        });

        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
