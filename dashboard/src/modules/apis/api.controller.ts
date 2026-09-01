import { toApiResponse } from "./api.mapper";
import { createApiSchema, updateApiSchema } from "./api.validation";
import { ApiService } from "./api.service";
import AppError from "@/infrastructure/errors/app-error";

export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  async create(request: Request, userId: string) {
    const body = await request.json();

    const input = createApiSchema.parse(body);

    const ret = await this.apiService.create(userId, input);

    return Response.json(
      {
        api: toApiResponse(ret.api),
        key: ret.rawKey,
      },
      {
        status: 201,
      },
    );
  }

  async findAll(userId: string) {
    const apis = await this.apiService.findAllByUserId(userId);

    return Response.json(apis.map(toApiResponse), {
      status: 200,
    });
  }

  async findById(apiId: string, userId: string) {
    const api = await this.apiService.findById(userId, apiId);

    if (!api) {
      throw new AppError("API not found", 404);
    }

    return Response.json(toApiResponse(api), {
      status: 200,
    });
  }

  async update(request: Request, apiId: string, userId: string) {
    const body = await request.json();

    const input = updateApiSchema.parse(body);

    const api = await this.apiService.update(userId, apiId, input);

    if (!api) {
      throw new AppError("API not found", 404);
    }

    return Response.json(toApiResponse(api), {
      status: 200,
    });
  }

  async delete(apiId: string, userId: string) {
    const api = await this.apiService.delete(userId, apiId);

    if (!api) {
      throw new AppError("API not found", 404);
    }

    return new Response(null, {
      status: 204,
    });
  }
}
