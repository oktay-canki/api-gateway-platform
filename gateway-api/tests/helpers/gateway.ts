import { createHash } from 'node:crypto';

import { match } from 'path-to-regexp';

import { createApp } from '../../src/app.js';
import { GatewayConfigCache } from '../../src/cache/gateway-config-cache.js';

import type { ApiConfig } from '../../src/types/api-config.js';
import type { CompiledRouteRule } from '../../src/types/compiled-route-rule.js';

export const TEST_API_KEY = 'test-api-key';

export const TEST_API_ID = 'test-api-id';

export const TEST_ROUTE_RULE_ID = 'test-route-rule-id';

export const MOCK_BACKEND_URL = 'http://localhost:4001';

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

export function createTestApi(overrides: Partial<ApiConfig> = {}): ApiConfig {
  return {
    apiId: TEST_API_ID,
    baseUrl: MOCK_BACKEND_URL,
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    rateLimit: {
      enabled: false,
      algorithm: 'sliding-window',
      maxRequests: 100,
      windowMs: 60_000,
    },
    timeoutMs: 1000,
    retryPolicy: {
      enabled: false,
      maxRetries: 0,
      retryDelayMs: 0,
    },
    ...overrides,
  };
}

export function createTestRoute(overrides: Partial<CompiledRouteRule> = {}): CompiledRouteRule {
  const routePattern = '/api/test/:path';

  return {
    routeRuleId: TEST_ROUTE_RULE_ID,
    apiId: TEST_API_ID,
    routePattern,
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    matcher: match(routePattern),
    specificityScore: 1,
    ...overrides,
  };
}

export function createTestApp(
  apiOverrides: Partial<ApiConfig> = {},
  routeOverrides: Partial<CompiledRouteRule> = {}
) {
  const cache = new GatewayConfigCache();

  cache.replace(
    new Map([
      [
        hashApiKey(TEST_API_KEY),
        {
          api: createTestApi(apiOverrides),
          routes: [createTestRoute(routeOverrides)],
        },
      ],
    ])
  );

  return createApp(cache);
}
