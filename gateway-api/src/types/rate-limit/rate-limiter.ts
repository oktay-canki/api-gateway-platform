import { RateLimitResult } from './rate-limit-result.js';
import { RateLimit } from './rate-limit.js';

export interface RateLimiter {
  check(key: string, config: RateLimit): Promise<RateLimitResult>;
}
