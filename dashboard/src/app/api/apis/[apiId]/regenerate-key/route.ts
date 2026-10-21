import { requireAuth } from "@/infrastructure/auth/require-auth";
import { handleRequest } from "@/infrastructure/http/handle-request";

import { ApiController } from "@/modules/apis/api.controller";
import { ApiService } from "@/modules/apis/api.service";

const apiService = new ApiService();
const apiController = new ApiController(apiService);

interface RouteContext {
  params: Promise<{
    apiId: string;
  }>;
}

export async function POST(_request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    const { apiId } = await context.params;

    return apiController.regenerateApiKey(userId, apiId);
  });
}
