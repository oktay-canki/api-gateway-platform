import { describe, expect, it } from 'vitest';

import { matchRoute } from '../../../src/route-matching/match-route.js';
import { createRouteRule } from '../../helpers/route-rule.js';
import { createApiConfig } from '../../helpers/api.js';

describe('matchRoute', () => {
  it('returns matched when the path and method match a route', () => {
    const rule = createRouteRule({
      allowedMethods: ['GET'],
    });

    const result = matchRoute(createApiConfig([rule]), '/users/123', 'GET');

    expect(result).toEqual({
      type: 'matched',
      rule,
      params: {
        id: '123',
      },
    });
  });

  it('returns method-not-allowed when the path matches but the method is not allowed', () => {
    const rule = createRouteRule({
      allowedMethods: ['GET'],
    });

    const result = matchRoute(createApiConfig([rule]), '/users/123', 'POST');

    expect(result).toEqual({
      type: 'method-not-allowed',
      allowedMethods: ['GET'],
    });
  });

  it('continues checking routes when a matching route does not allow the method', () => {
    const restrictedRule = createRouteRule({
      routeRuleId: 'route-1',
      allowedMethods: ['GET'],
    });

    const allowedRule = createRouteRule({
      routeRuleId: 'route-2',
      allowedMethods: ['POST'],
    });

    const result = matchRoute(createApiConfig([restrictedRule, allowedRule]), '/users/123', 'POST');

    expect(result).toEqual({
      type: 'matched',
      rule: allowedRule,
      params: {
        id: '123',
      },
    });
  });

  it('returns no-match when no route matches the path', () => {
    const rule = createRouteRule();

    const result = matchRoute(createApiConfig([rule]), '/posts/123', 'GET');

    expect(result).toEqual({
      type: 'no-match',
    });
  });
});
