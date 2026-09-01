import { requireAuth } from "@/infrastructure/auth/require-auth";
import { handleRequest } from "@/infrastructure/http/handle-request";

import { RouteRuleController } from "@/modules/route-rules/route-rule.controller";
import { RouteRuleService } from "@/modules/route-rules/route-rule.service";

const routeRuleService = new RouteRuleService();
const routeRuleController = new RouteRuleController(routeRuleService);

interface RouteContext {
  params: Promise<{
    apiId: string;
    routeRuleId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    const { apiId, routeRuleId } = await context.params;

    return routeRuleController.findById(userId, apiId, routeRuleId);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    const { apiId, routeRuleId } = await context.params;

    return routeRuleController.update(request, userId, apiId, routeRuleId);
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    const { apiId, routeRuleId } = await context.params;

    return routeRuleController.delete(userId, apiId, routeRuleId);
  });
}
