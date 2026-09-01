import { requireAuth } from "@/infrastructure/auth/require-auth";
import { JwtService } from "@/infrastructure/auth/jwt.service";
import { vi } from "vitest";
import { User } from "@/modules/users/user.model";
import AppError from "@/infrastructure/errors/app-error";

const jwtService = new JwtService();

export async function createAuthToken(userId: string): Promise<string> {
  return jwtService.sign({ userId });
}

export const mockRequireAuth = vi.mocked(requireAuth);

export function authenticateTestUser(userId: string) {
  mockRequireAuth.mockResolvedValue({ userId });
}

export function resetAuthMock() {
  mockRequireAuth.mockReset();
  mockRequireAuth.mockRejectedValue(new AppError("Unauthorized", 401));
}

export async function setupAuthenticatedUser() {
  const user = await User.create({
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "password123",
  });

  authenticateTestUser(user._id.toString());

  return user;
}
