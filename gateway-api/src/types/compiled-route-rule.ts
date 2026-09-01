import { MatchFunction } from 'path-to-regexp';
import { RouteRuleConfig } from './route-rule-config.js';

export type RouteParams = Partial<Record<string, string | string[]>>;

export interface CompiledRouteRule extends RouteRuleConfig {
  matcher: MatchFunction<RouteParams>;
  specificityScore: number;
}
