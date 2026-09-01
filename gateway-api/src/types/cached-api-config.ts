import type { ApiConfig } from '../types/api-config.js';
import type { RouteRuleConfig } from '../types/route-rule-config.js';

export interface CachedApiConfig {
  config: ApiConfig;
  routes: RouteRuleConfig[];
}
