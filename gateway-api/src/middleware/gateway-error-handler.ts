import type { NextFunction, Request, Response } from 'express';

import { GatewayError } from '../errors/gateway-error.js';

export function gatewayErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof GatewayError) {
    res.status(error.statusCode).json({
      error: error.message,
    });

    return;
  }

  console.error('[gateway]', error);

  res.status(500).json({
    error: 'Internal Server Error',
  });
}
