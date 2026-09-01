import { HttpMethod } from './http-methods.js';
import { ApiRateLimit } from './rate-limit/rate-limit.js';
import { ApiRetryPolicy } from './retry.js';

export interface ApiConfig {
  apiId: string;
  baseUrl: string;
  allowedMethods: HttpMethod[];
  rateLimit: ApiRateLimit;
  timeoutMs: number;
  retryPolicy: ApiRetryPolicy;
}
