import { Request, Response, NextFunction } from 'express';
import { matchRoute } from '../route-matching/match-route.js';
import { resolveRouteConfig } from '../route-matching/resolve-route-config.js';
import { HttpMethod } from '../types/http-methods.js';

export function resolveRoute(req: Request, res: Response, next: NextFunction): void {
  const gatewayConfig = req.gatewayConfig;

  if (!gatewayConfig) {
    res.status(500).json({ error: 'Gateway config is missing' });
    return;
  }

  // If request does not abide RouteRule.allowedMethods
  const result = matchRoute(gatewayConfig, req.path, req.method as HttpMethod);
  if (result.type === 'method-not-allowed') {
    res
      .status(405)
      .set('Allow', result.allowedMethods.join(', '))
      .json({ error: 'Method not allowed for this route' });
    return;
  }

  const resolvedRouteConfig = resolveRouteConfig(gatewayConfig.api, result);

  // If no matching route rules, then check for API.allowedMethods
  if (
    resolvedRouteConfig.allowedMethods &&
    !resolvedRouteConfig.allowedMethods.includes(req.method as HttpMethod)
  ) {
    res
      .status(405)
      .set('Allow', resolvedRouteConfig.allowedMethods.join(', '))
      .json({ error: 'Method not allowed for this API' });
    return;
  }

  req.resolvedRouteConfig = resolvedRouteConfig;
  next();
}
