import { RouteParams } from './compiled-route-rule.js';
import { HttpMethod } from './http-methods.js';
import { RateLimit } from './rate-limit/rate-limit.js';
import { RetryPolicy } from './retry.js';

export interface ResolvedRouteConfig {
  apiId: string;
  routeRuleId?: string;
  baseUrl: string;
  allowedMethods?: HttpMethod[];
  rateLimit?: RateLimit;
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
  params: RouteParams;
}
