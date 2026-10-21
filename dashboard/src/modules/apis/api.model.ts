import mongoose, { type Model } from "mongoose";
import { apiSchema } from "./api.schema";
import type { IApiDocument } from "./api.document";

export const Api: Model<IApiDocument> =
  mongoose.models.Api ?? mongoose.model<IApiDocument>("Api", apiSchema);
