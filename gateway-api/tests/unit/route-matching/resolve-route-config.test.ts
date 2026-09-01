import { describe, expect, it } from 'vitest';

import { resolveRouteConfig } from '../../../src/route-matching/resolve-route-config.js';
import { createApiConfig } from '../../helpers/api.js';
import { createRouteRule } from '../../helpers/route-rule.js';

describe('resolveRouteConfig', () => {
  it('uses route-level configuration when a route matches', () => {
    const rule = createRouteRule({
      allowedMethods: ['GET'],
      rateLimit: {
        algorithm: 'sliding-window',
        maxRequests: 10,
        windowMs: 10_000,
      },
      timeoutMs: 2_000,
      retryPolicy: {
        maxRetries: 1,
        retryDelayMs: 100,
      },
    });

    const apiConfig = createApiConfig([rule]);

    const result = resolveRouteConfig(apiConfig.api, {
      type: 'matched',
      rule,
      params: { id: '123' },
    });

    expect(result).toEqual({
      apiId: 'api-1',
      routeRuleId: 'route-1',
      baseUrl: 'http://localhost:4001',
      allowedMethods: ['GET'],
      rateLimit: rule.rateLimit,
      timeoutMs: 2_000,
      retryPolicy: rule.retryPolicy,
      params: { id: '123' },
    });
  });

  it('falls back to API-level configuration when no route matches', () => {
    const apiConfig = createApiConfig([]);

    const result = resolveRouteConfig(apiConfig.api, {
      type: 'no-match',
    });

    expect(result).toEqual({
      apiId: 'api-1',
      routeRuleId: undefined,
      baseUrl: 'http://localhost:4001',
      allowedMethods: apiConfig.api.allowedMethods,
      rateLimit: apiConfig.api.rateLimit,
      timeoutMs: apiConfig.api.timeoutMs,
      retryPolicy: apiConfig.api.retryPolicy,
      params: {},
    });
  });
});
