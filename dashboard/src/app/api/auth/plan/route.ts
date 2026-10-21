import { requireAuth } from "@/infrastructure/auth/require-auth";
import { handleRequest } from "@/infrastructure/http/handle-request";
import { UserController } from "@/modules/users/user.controller";
import { UserService } from "@/modules/users/user.service";
import { JwtService } from "@/infrastructure/auth/jwt.service";

const jwtService = new JwtService();
const userService = new UserService(jwtService);
const userController = new UserController(userService);

export async function PATCH(request: Request) {
  return handleRequest(async () => {
    const { userId } = await requireAuth();

    return userController.changePlan(request, userId);
  });
}
