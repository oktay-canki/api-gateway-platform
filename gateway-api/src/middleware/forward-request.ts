import type { NextFunction, Request, Response } from 'express';

import { proxyRequest } from '../proxy/proxy-request.js';

const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isRetryableMethod(method: string): boolean {
  return RETRYABLE_METHODS.has(method);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function forwardRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const routeConfig = req.resolvedRouteConfig;

  if (!routeConfig) {
    res.status(500).json({ error: 'Resolved route config is missing' });
    return;
  }

  const retryPolicy = routeConfig.retryPolicy;

  const maxRetries = retryPolicy && isRetryableMethod(req.method) ? retryPolicy.maxRetries : 0;

  const retryDelayMs = retryPolicy?.retryDelayMs ?? 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await proxyRequest(req, res);
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        next(error);
        return;
      }

      await delay(retryDelayMs);
    }
  }
}
