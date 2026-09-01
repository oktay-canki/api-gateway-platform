import { afterAll, beforeEach } from 'vitest';
import { closeDb, getDb } from '../../src/lib/mongodb.js';
import { redisClient } from '../../src/lib/redis.js';

beforeEach(async () => {
  const db = await getDb();

  await Promise.all([
    db.collection('apis').deleteMany({}),
    db.collection('routerules').deleteMany({}),
    redisClient.flushdb(),
  ]);
});

afterAll(async () => {
  await Promise.all([closeDb(), redisClient.quit()]);
});
