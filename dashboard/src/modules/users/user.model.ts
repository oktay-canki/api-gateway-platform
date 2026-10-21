import mongoose, { type Model } from "mongoose";
import { userSchema } from "./user.schema";
import type { IUserDocument } from "./user.document";

export const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", userSchema);
