import type { ObjectId } from 'mongodb';
import type { HttpMethod } from './http-methods.js';
import type { RateLimit } from './rate-limit/rate-limit.js';
import type { RetryPolicy } from './retry.js';

export interface RouteRuleDocument {
  _id: ObjectId;
  apiId: ObjectId;
  routePattern: string;
  allowedMethods?: HttpMethod[];
  rateLimit?: RateLimit;
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
}
