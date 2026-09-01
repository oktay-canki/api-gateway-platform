import { loginUserSchema, registerUserSchema } from "./user.validation";
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

  async me(userId: string) {
    const user = await this.userService.findById(userId);

    if (!user) throw new AppError("Unauthorized", 401);

    return Response.json(toUserResponse(user), { status: 200 });
  }
}
