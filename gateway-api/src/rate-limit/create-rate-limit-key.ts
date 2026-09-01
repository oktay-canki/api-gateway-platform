import { ResolvedRouteConfig } from '../types/resolved-route-config.js';

export function createRateLimitKey(config: ResolvedRouteConfig): string {
  if (config.routeRuleId) {
    return `rate-limit:${config.apiId}:route:${config.routeRuleId}`;
  }

  return `rate-limit:${config.apiId}:api`;
}
