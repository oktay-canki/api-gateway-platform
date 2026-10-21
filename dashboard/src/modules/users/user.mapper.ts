import type { HydratedDocument } from "mongoose";
import type { IUserDocument } from "./user.document";
import type { UserResponse } from "./user.types";

export function toUserResponse(
  user: HydratedDocument<IUserDocument>,
): UserResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    plan: user.plan,
  };
}
