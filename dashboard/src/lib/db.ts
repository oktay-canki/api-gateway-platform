import mongoose from "mongoose";

import { config } from "@/config/env";

import AppError from "@/infrastructure/errors/app-error";

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = config.db.mongoUri;

  if (!mongoUri) {
    throw new AppError("MONGODB_URI is not defined", 500);
  }

  await mongoose.connect(mongoUri);

  return mongoose.connection;
}
