import type { HydratedDocument } from "mongoose";
import type { IUser } from "./user.schema";

export function toUserResponse(user: HydratedDocument<IUser>) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
