import { Redis } from 'ioredis';
import { envConfig } from '../config/env.js';

export const redisClient = new Redis(envConfig.redisUrl);

redisClient.on('connect', () => {
  if (envConfig.nodeEnv === 'development') console.log('Redis connected');
});

redisClient.on('error', (err: Error) => {
  if (envConfig.nodeEnv === 'development') console.error('Redis connection error:', err);
});

redisClient.on('close', () => {
  if (envConfig.nodeEnv === 'development') console.warn('Redis connection closed');
});
