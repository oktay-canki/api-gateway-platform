import type { NextFunction, Request, Response } from 'express';
import type { IGatewayConfig } from '../../src/cache/gateway-config-cache.js';
import type { ResolvedRouteConfig } from '../../src/types/resolved-route-config.js';
import { vi } from 'vitest';

export type TestRequest = Request & {
  gatewayConfig?: IGatewayConfig;
  resolvedRouteConfig?: ResolvedRouteConfig;
};

type TestRequestOverrides = {
  path?: string;
  method?: string;
  gatewayConfig?: IGatewayConfig;
  resolvedRouteConfig?: ResolvedRouteConfig;
};

export function createRequest(overrides: TestRequestOverrides = {}): TestRequest {
  return {
    path: '/users/123',
    method: 'GET',

    resolvedRouteConfig: {
      apiId: 'test-api-id',
      baseUrl: 'https://example.com',
      params: {},
      timeoutMs: 5000,
      retryPolicy: {
        maxRetries: 2,
        retryDelayMs: 100,
      },
    },

    ...overrides,
  } as TestRequest;
}

export function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

export function createNext(): NextFunction {
  return vi.fn();
}
