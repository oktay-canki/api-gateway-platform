import mongoose, { type Model } from "mongoose";
import { userSchema, IUser } from "./user.schema";

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
