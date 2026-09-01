import { ApiConfig } from '../types/api-config.js';
import { ResolvedRouteConfig } from '../types/resolved-route-config.js';
import { MatchResult } from './match-route.js';

export function resolveRouteConfig(api: ApiConfig, result: MatchResult): ResolvedRouteConfig {
  const rule = result.type === 'matched' ? result.rule : undefined;
  const params = result.type === 'matched' ? result.params : {};

  return {
    apiId: api.apiId,
    routeRuleId: rule?.routeRuleId,
    baseUrl: api.baseUrl,
    allowedMethods: rule?.allowedMethods ?? api.allowedMethods,
    rateLimit: rule?.rateLimit ?? api.rateLimit,
    timeoutMs: rule?.timeoutMs ?? api.timeoutMs,
    retryPolicy: rule?.retryPolicy ?? api.retryPolicy,
    params,
  };
}
