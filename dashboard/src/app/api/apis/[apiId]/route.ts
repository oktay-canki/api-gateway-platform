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

export async function GET(_request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();
    const { apiId } = await context.params;

    return apiController.findById(apiId, userId);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();
    const { apiId } = await context.params;

    return apiController.update(request, apiId, userId);
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();
    const { apiId } = await context.params;

    return apiController.delete(apiId, userId);
  });
}
