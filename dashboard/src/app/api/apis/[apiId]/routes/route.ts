import { requireAuth } from "@/infrastructure/auth/require-auth";
import { handleRequest } from "@/infrastructure/http/handle-request";

import { RouteRuleController } from "@/modules/route-rules/route-rule.controller";
import { RouteRuleService } from "@/modules/route-rules/route-rule.service";

const routeRuleService = new RouteRuleService();
const routeRuleController = new RouteRuleController(routeRuleService);

interface RouteContext {
  params: Promise<{
    apiId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();
    const { apiId } = await context.params;

    return routeRuleController.create(request, userId, apiId);
  });
}

export async function GET(_request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();
    const { apiId } = await context.params;

    return routeRuleController.findAll(userId, apiId);
  });
}
