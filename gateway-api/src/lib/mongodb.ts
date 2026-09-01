import { MongoClient, type Db } from 'mongodb';
import { envConfig } from '../config/env.js';

const client = new MongoClient(envConfig.mongoDbUri);

let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  await client.connect();

  db = client.db(envConfig.mongoDbDbName);

  return db;
}

export async function closeDb(): Promise<void> {
  await client.close();
  db = null;
}
