import { HttpMethod } from './http-methods.js';
import { RateLimit } from './rate-limit/rate-limit.js';
import { RetryPolicy } from './retry.js';

export interface RouteRuleConfig {
  routeRuleId: string;
  apiId: string;

  routePattern: string;

  allowedMethods?: HttpMethod[];

  rateLimit?: RateLimit;

  timeoutMs?: number;

  retryPolicy?: RetryPolicy;
}
