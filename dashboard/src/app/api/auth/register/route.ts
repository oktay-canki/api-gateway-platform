import { JwtService } from "@/infrastructure/auth/jwt.service";
import { handleRequest } from "@/infrastructure/http/handle-request";
import { UserController } from "@/modules/users/user.controller";
import { UserService } from "@/modules/users/user.service";

const jwtService = new JwtService();
const userService = new UserService(jwtService);
const userController = new UserController(userService);

export async function POST(request: Request) {
  return handleRequest(() => userController.register(request));
}
