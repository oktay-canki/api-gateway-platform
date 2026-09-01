import { toRouteRuleResponse } from "./route-rule.mapper";
import {
  createRouteRuleSchema,
  updateRouteRuleSchema,
} from "./route-rule.validation";
import { RouteRuleService } from "./route-rule.service";

export class RouteRuleController {
  constructor(private readonly routeRuleService: RouteRuleService) {}

  async create(request: Request, userId: string, apiId: string) {
    const body = await request.json();

    const input = createRouteRuleSchema.parse(body);

    const routeRule = await this.routeRuleService.create(userId, apiId, input);

    return Response.json(toRouteRuleResponse(routeRule), { status: 201 });
  }

  async findAll(userId: string, apiId: string) {
    const routeRules = await this.routeRuleService.findAllByApi(userId, apiId);

    return Response.json(routeRules.map(toRouteRuleResponse), { status: 200 });
  }

  async findById(userId: string, apiId: string, routeRuleId: string) {
    const routeRule = await this.routeRuleService.findById(
      userId,
      apiId,
      routeRuleId,
    );

    return Response.json(toRouteRuleResponse(routeRule), { status: 200 });
  }

  async update(
    request: Request,
    userId: string,
    apiId: string,
    routeRuleId: string,
  ) {
    const body = await request.json();

    const input = updateRouteRuleSchema.parse(body);

    const routeRule = await this.routeRuleService.update(
      userId,
      apiId,
      routeRuleId,
      input,
    );

    return Response.json(toRouteRuleResponse(routeRule), { status: 200 });
  }

  async delete(userId: string, apiId: string, routeRuleId: string) {
    await this.routeRuleService.delete(userId, apiId, routeRuleId);

    return new Response(null, {
      status: 204,
    });
  }
}
