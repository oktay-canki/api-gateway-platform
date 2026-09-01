import { Router, Request, Response } from 'express';
import { redisClient } from '../lib/redis.js';

const router = Router();

const SERVICES = {
  'mock-backend': process.env.MOCK_BACKEND_URL,
};

async function checkService(name: string, baseUrl: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await response.json();
    return { name, status: response.ok ? 'ok' : 'error', details: data };
  } catch (error) {
    return { name, status: 'unreachable', error: (error as Error).message };
  }
}

router.get('/', async (req: Request, res: Response) => {
  // Check Redis
  let redisStatus = 'unknown';
  try {
    const pong = await redisClient.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'error';
  } catch {
    redisStatus = 'disconnected';
  }

  // Check services in parallel
  const results = await Promise.all(
    Object.entries(SERVICES).map(([name, url]) => checkService(name, url!))
  );

  const allHealthy = redisStatus === 'connected' && results.every((r) => r.status === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    gateway: {
      redis: redisStatus,
    },
    services: results,
    timestamp: new Date().toISOString(),
  });
});

export default router;
