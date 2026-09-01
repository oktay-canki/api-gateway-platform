import { IGatewayConfig } from '../cache/gateway-config-cache.js';
import { CompiledRouteRule, RouteParams } from '../types/compiled-route-rule.js';
import { HttpMethod } from '../types/http-methods.js';

export type MatchResult =
  | { type: 'matched'; rule: CompiledRouteRule; params: RouteParams }
  | { type: 'method-not-allowed'; allowedMethods: HttpMethod[] }
  | { type: 'no-match' };

export function matchRoute(config: IGatewayConfig, path: string, method: HttpMethod): MatchResult {
  const mismatchedMethods = new Set<HttpMethod>();

  for (const rule of config.routes) {
    const result = rule.matcher(path);
    if (!result) {
      continue; // path doesn't match this rule at all, keep scanning
    }

    if (rule.allowedMethods && !rule.allowedMethods.includes(method)) {
      // path matched, method didn't — remember it, but keep scanning
      // in case a more/less specific rule for the same path allows this method
      rule.allowedMethods.forEach((m) => mismatchedMethods.add(m));
      continue;
    }

    return { type: 'matched', rule, params: result.params };
  }

  if (mismatchedMethods.size > 0) {
    return { type: 'method-not-allowed', allowedMethods: Array.from(mismatchedMethods) };
  }

  return { type: 'no-match' };
}
