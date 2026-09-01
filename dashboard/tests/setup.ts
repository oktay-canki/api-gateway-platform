import dotenv from "dotenv";
dotenv.config({
  path: ".env.test",
  quiet: true,
});

import { vi } from "vitest";
vi.mock("@/infrastructure/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));
