import type { ObjectId } from 'mongodb';
import type { HttpMethod } from './http-methods.js';
import type { ApiRetryPolicy } from './retry.js';
import { ApiRateLimit } from './rate-limit/rate-limit.js';

export interface ApiDocument {
  _id: ObjectId;
  status: 'active' | 'disabled';
  apiKeyHash: string;
  baseUrl: string;
  allowedMethods: HttpMethod[];
  rateLimit: ApiRateLimit;
  timeoutMs: number;
  retryPolicy: ApiRetryPolicy;
}
