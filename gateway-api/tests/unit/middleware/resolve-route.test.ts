import { describe, expect, it } from 'vitest';

import { resolveRoute } from '../../../src/middleware/resolve-route.js';

import { createApiConfig } from '../../helpers/api.js';
import { createNext, createRequest, createResponse } from '../../helpers/express.js';
import { createRouteRule } from '../../helpers/route-rule.js';

describe('resolveRoute', () => {
  it('returns 405 when the matched route does not allow the method', () => {
    const rule = createRouteRule({
      allowedMethods: ['GET'],
    });

    const req = createRequest({
      path: '/users/123',
      method: 'POST',
      gatewayConfig: createApiConfig([rule]),
    });

    const res = createResponse();
    const next = createNext();

    resolveRoute(req, res, next);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.set).toHaveBeenCalledWith('Allow', 'GET');
    expect(res.json).toHaveBeenCalledWith({
      error: 'Method not allowed for this route',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 405 when the API does not allow the method', () => {
    const gatewayConfig = createApiConfig([]);

    gatewayConfig.api.allowedMethods = ['GET'];

    const req = createRequest({
      path: '/users/123',
      method: 'POST',
      gatewayConfig,
    });

    const res = createResponse();
    const next = createNext();

    resolveRoute(req, res, next);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.set).toHaveBeenCalledWith('Allow', 'GET');
    expect(res.json).toHaveBeenCalledWith({
      error: 'Method not allowed for this API',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('resolves the route config and calls next when the method is allowed', () => {
    const rule = createRouteRule({
      allowedMethods: ['GET'],
    });

    const gatewayConfig = createApiConfig([rule]);

    const req = createRequest({
      path: '/users/123',
      method: 'GET',
      gatewayConfig,
    });

    const res = createResponse();
    const next = createNext();

    resolveRoute(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.resolvedRouteConfig).toBeDefined();
    expect(req.resolvedRouteConfig?.routeRuleId).toBe('route-1');
  });
});
