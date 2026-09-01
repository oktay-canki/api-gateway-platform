import type { ApiConfig } from '../types/api-config.js';
import type { RouteRuleConfig } from '../types/route-rule-config.js';
import type { ApiDocument } from '../types/api-document.js';
import type { RouteRuleDocument } from '../types/route-rule-document.js';
import { getDb } from '../lib/mongodb.js';
import { GatewayConfigCache, type IGatewayConfig } from './gateway-config-cache.js';
import { compileRouteRule } from '../route-matching/compile-route-rule.js';

export async function loadGatewayConfig(cache: GatewayConfigCache): Promise<void> {
  const db = await getDb();

  const [apis, routeRules] = await Promise.all([
    db.collection<ApiDocument>('apis').find().toArray(),
    db.collection<RouteRuleDocument>('routerules').find().toArray(),
  ]);

  const newConfigs = new Map<string, IGatewayConfig>();
  const apiById = new Map<string, IGatewayConfig>();

  for (const api of apis) {
    const apiId = api._id.toString();

    const config: ApiConfig = {
      apiId,
      baseUrl: api.baseUrl,
      allowedMethods: api.allowedMethods,
      rateLimit: api.rateLimit,
      timeoutMs: api.timeoutMs,
      retryPolicy: api.retryPolicy,
    };

    const cachedApi: IGatewayConfig = {
      api: config,
      routes: [],
    };

    newConfigs.set(api.apiKeyHash, cachedApi);
    apiById.set(apiId, cachedApi);
  }

  for (const route of routeRules) {
    const api = apiById.get(route.apiId.toString());
    if (!api) continue;

    const routeConfig: RouteRuleConfig = {
      routeRuleId: route._id.toString(),
      apiId: route.apiId.toString(),
      routePattern: route.routePattern,
      allowedMethods: route.allowedMethods,
      rateLimit: route.rateLimit,
      timeoutMs: route.timeoutMs,
      retryPolicy: route.retryPolicy,
    };

    api.routes.push(compileRouteRule(routeConfig));
  }

  // sort each API's rules by specificity once, at build time — not per request
  for (const config of apiById.values()) {
    config.routes.sort((a, b) => b.specificityScore - a.specificityScore);
  }

  cache.replace(newConfigs);
}
