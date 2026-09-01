import mongoose, { type Model } from "mongoose";
import { apiSchema, type IApi } from "./api.schema";

export const Api: Model<IApi> =
  mongoose.models.Api ?? mongoose.model<IApi>("Api", apiSchema);
