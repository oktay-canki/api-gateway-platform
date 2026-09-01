import { requireAuth } from "@/infrastructure/auth/require-auth";
import { handleRequest } from "@/infrastructure/http/handle-request";
import { ApiController } from "@/modules/apis/api.controller";
import { ApiService } from "@/modules/apis/api.service";

const apiService = new ApiService();
const apiController = new ApiController(apiService);

export async function POST(request: Request) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    return apiController.create(request, userId);
  });
}

export async function GET() {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    return apiController.findAll(userId);
  });
}
