import {
  changePlanSchema,
  loginUserSchema,
  registerUserSchema,
} from "./user.validation";
import { UserService } from "./user.service";
import { toUserResponse } from "@/modules/users/user.mapper";
import { AUTH_TOKEN_NAME } from "@/lib/auth-constants";
import AppError from "@/infrastructure/errors/app-error";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async register(request: Request) {
    const body = await request.json();

    const input = registerUserSchema.parse(body);

    const user = await this.userService.register(input);

    return Response.json(toUserResponse(user), { status: 201 });
  }

  async login(request: Request) {
    const body = await request.json();

    const input = loginUserSchema.parse(body);

    const { user, token } = await this.userService.login(input);

    const response = Response.json(toUserResponse(user), {
      status: 200,
    });

    response.headers.append(
      "Set-Cookie",
      `${AUTH_TOKEN_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax`,
    );

    return response;
  }

  async logout() {
    const response = Response.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );

    response.headers.append(
      "Set-Cookie",
      `${AUTH_TOKEN_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
    );

    return response;
  }

  async me(userId: string) {
    const user = await this.userService.findById(userId);

    if (!user) throw new AppError("Unauthorized", 401);

    return Response.json(toUserResponse(user), { status: 200 });
  }

  async changePlan(request: Request, userId: string) {
    const body = await request.json();
    const input = changePlanSchema.parse(body);

    const user = await this.userService.changePlan(userId, input.plan);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return Response.json(toUserResponse(user), { status: 200 });
  }

  async deleteAccount(userId: string) {
    const user = await this.userService.deleteAccount(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const response = Response.json(
      { message: "Account deleted successfully" },
      { status: 200 },
    );

    response.headers.append(
      "Set-Cookie",
      `${AUTH_TOKEN_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
    );

    return response;
  }
}
