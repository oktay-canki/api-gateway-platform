import { match } from 'path-to-regexp';
import { CompiledRouteRule } from '../types/compiled-route-rule.js';
import { RouteRuleConfig } from '../types/route-rule-config.js';
import { computeSpecificity } from './compute-specificity.js';

export function compileRouteRule(route: RouteRuleConfig): CompiledRouteRule {
  const matcher = match(route.routePattern, { decode: decodeURIComponent });

  return {
    ...route,
    matcher,
    specificityScore: computeSpecificity(route.routePattern),
  };
}
