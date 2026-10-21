import type { HydratedDocument } from "mongoose";
import type { IRouteRuleDocument } from "./route-rule.document";
import type { RouteRuleResponse } from "./route-rule.types";

export function toRouteRuleResponse(
  routeRule: HydratedDocument<IRouteRuleDocument>,
): RouteRuleResponse {
  return {
    id: routeRule._id.toString(),
    apiId: routeRule.apiId.toString(),
    routePattern: routeRule.routePattern,
    rateLimit: routeRule.rateLimit,
    allowedMethods: routeRule.allowedMethods,
    timeoutMs: routeRule.timeoutMs,
    retryPolicy: routeRule.retryPolicy
      ? {
          enabled: routeRule.retryPolicy.enabled,
          maxRetries: routeRule.retryPolicy.maxRetries,
          retryDelayMs: routeRule.retryPolicy.retryDelayMs,
        }
      : undefined,
    createdAt: routeRule.createdAt.toISOString(),
    updatedAt: routeRule.updatedAt.toISOString(),
  };
}
