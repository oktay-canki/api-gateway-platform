import { Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import type { IRouteRuleDocument } from "@/modules/route-rules/route-rule.document";
import { RouteRule } from "@/modules/route-rules/route-rule.model";
import type { CreateRouteRuleInput } from "@/modules/route-rules/route-rule.validation";

export function buildRouteRulePayload(
  overrides: Partial<CreateRouteRuleInput> = {},
): CreateRouteRuleInput {
  return {
    routePattern: "/users/*path",
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
    overrides?: Partial<CreateRouteRuleInput>;
  }[],
) {
  const ret: HydratedDocument<IRouteRuleDocument>[] = [];

  for (const d of data) {
    const routeRule = await RouteRule.create({
      apiId: d.apiId,
      ...buildRouteRulePayload({
        routePattern: d.routePattern,
        ...d.overrides,
      }),
    });

    ret.push(routeRule);
  }

  return ret;
}
