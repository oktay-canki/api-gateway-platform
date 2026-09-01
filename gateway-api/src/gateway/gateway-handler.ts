import { Router } from 'express';
import type { GatewayConfigCache } from '../cache/gateway-config-cache.js';
import { createAuthenticateApiKey } from '../middleware/authenticate-api-key.js';
import { resolveRoute } from '../middleware/resolve-route.js';
import { createRateLimitMiddleware } from '../middleware/rate-limit.js';
import { redisClient } from '../lib/redis.js';
import { SlidingWindowRateLimiter } from '../rate-limit/sliding-window-rate-limiter.js';
import { TokenBucketRateLimiter } from '../rate-limit/token-bucket-rate-limiter.js';
import { forwardRequest } from '../middleware/forward-request.js';

export function gatewayHandler(configCache: GatewayConfigCache) {
  const router = Router();

  // API Key authentication
  router.use(createAuthenticateApiKey(configCache)); // attaches req.gatewayConfig

  // Config resolution for route
  router.use(resolveRoute); // attaches req.resolvedRouteConfig

  // Rate limiting
  const rateLimiters = {
    'sliding-window': new SlidingWindowRateLimiter(redisClient),
    'token-bucket': new TokenBucketRateLimiter(redisClient),
  };
  router.use(createRateLimitMiddleware(rateLimiters));

  // Orchestrates the gateway-level forwarding, retry and timeout(in proxy-request)
  router.use(forwardRequest);

  return router;
}
