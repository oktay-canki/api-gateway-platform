import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { GatewayConfigCache } from '../cache/gateway-config-cache.js';

function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

export function createAuthenticateApiKey(gatewayConfigCache: GatewayConfigCache) {
  return function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
    const rawKey = req.get('X-API-Key');

    if (!rawKey) {
      res.status(401).json({
        error: 'Missing API key',
      });
      return;
    }

    const apiKeyHash = hashApiKey(rawKey);

    const gatewayConfig = gatewayConfigCache.get(apiKeyHash);

    if (!gatewayConfig) {
      res.status(401).json({
        error: 'Invalid API key',
      });
      return;
    }

    req.gatewayConfig = gatewayConfig;

    next();
  };
}
