import type { HydratedDocument } from "mongoose";

import type { IRouteRule } from "./route-rule.schema";

export function toRouteRuleResponse(routeRule: HydratedDocument<IRouteRule>) {
  return {
    id: routeRule._id.toString(),
    apiId: routeRule.apiId.toString(),
    routePattern: routeRule.routePattern,
    rateLimit: routeRule.rateLimit,
    allowedMethods: routeRule.allowedMethods,
    timeoutMs: routeRule.timeoutMs,
    retryPolicy: routeRule.retryPolicy,
    createdAt: routeRule.createdAt,
    updatedAt: routeRule.updatedAt,
  };
}
