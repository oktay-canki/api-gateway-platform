import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { syncIndexes } from "mongoose";
import { afterAll, beforeAll } from "vitest";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
