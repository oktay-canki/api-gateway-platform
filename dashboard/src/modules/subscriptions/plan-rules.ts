import type { Plan } from "@/modules/users/user.types";
import type { RateLimit } from "@/modules/apis/api.types";
import AppError from "@/infrastructure/errors/app-error";

export function validateRateLimitPlan(
  plan: Plan,
  rateLimit: RateLimit | undefined,
) {
  if (rateLimit?.algorithm !== "token-bucket") {
    return;
  }

  if (plan === "free") {
    throw new AppError("Token bucket rate limiting requires a Pro plan.", 403);
  }
}
