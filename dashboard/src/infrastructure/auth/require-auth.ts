import { cookies } from "next/headers";

import AppError from "@/infrastructure/errors/app-error";
import { JwtService } from "./jwt.service";
import { AUTH_TOKEN_NAME } from "@/lib/auth-constants";

const jwtService = new JwtService();

export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_NAME)?.value;

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  return jwtService.verify(token);
}
