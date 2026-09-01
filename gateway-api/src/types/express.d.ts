import type { IGatewayConfig } from '../cache/gateway-config-cache.js';
import type { ResolvedRouteConfig } from './resolved-route-config.js';

declare global {
  namespace Express {
    interface Request {
      gatewayConfig?: IGatewayConfig;
      resolvedRouteConfig?: ResolvedRouteConfig;
    }
  }
}

export {};
