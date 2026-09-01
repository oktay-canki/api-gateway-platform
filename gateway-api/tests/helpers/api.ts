import { IGatewayConfig } from '../../src/cache/gateway-config-cache';
import { CompiledRouteRule } from '../../src/types/compiled-route-rule';

export function createApiConfig(routes: CompiledRouteRule[]): IGatewayConfig {
  return {
    api: {
      apiId: 'api-1',
      baseUrl: 'http://localhost:4001',
      allowedMethods: ['GET', 'POST'],
      rateLimit: {
        enabled: true,
        algorithm: 'sliding-window',
        maxRequests: 5,
        windowMs: 6000,
      },
      timeoutMs: 5000,
      retryPolicy: {
        enabled: true,
        maxRetries: 2,
        retryDelayMs: 5000,
      },
    },
    routes,
  };
}
