import { RouteRule } from "@/modules/route-rules/route-rule.model";
import { IRouteRule } from "@/modules/route-rules/route-rule.schema";
import { CreateRouteRuleInput } from "@/modules/route-rules/route-rule.validation";
import { HydratedDocument, Types } from "mongoose";

export function buildRouteRulePayload(
  overrides: Partial<CreateRouteRuleInput> = {},
): CreateRouteRuleInput {
  return {
    routePattern: "/users/*",
    allowedMethods: ["GET", "POST"],
    timeoutMs: 5_000,
    retryPolicy: {
      enabled: true,
      maxRetries: 2,
      retryDelayMs: 500,
    },
    ...overrides,
  };
}

export async function createRouteRules(
  data: {
    apiId: Types.ObjectId;
    routePattern: string;
  }[],
) {
  const ret: HydratedDocument<IRouteRule>[] = [];

  for (const d of data) {
    const routeRule = await RouteRule.create({
      apiId: d.apiId,
      ...buildRouteRulePayload({
        routePattern: d.routePattern,
      }),
    });

    ret.push(routeRule);
  }

  return ret;
}
