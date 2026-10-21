import { Types } from "mongoose";

import { User } from "@/modules/users/user.model";
import type { Plan } from "@/modules/users/user.types";

export async function createUser(plan: Plan = "free") {
  return User.create({
    name: "Test User",
    email: `${new Types.ObjectId()}@example.com`,
    passwordHash: "test-password",
    plan,
  });
}
