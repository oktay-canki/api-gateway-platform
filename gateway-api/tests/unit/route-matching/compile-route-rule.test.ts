import { describe, expect, it } from 'vitest';

import { compileRouteRule } from '../../../src/route-matching/compile-route-rule.js';

describe('compileRouteRule', () => {
  it('compiles the route pattern and calculates its specificity', () => {
    const route = compileRouteRule({
      routeRuleId: 'route-1',
      apiId: 'api-1',
      routePattern: '/users/:id',
    });

    expect(route.specificityScore).toBe(110);

    expect(route.matcher('/users/123')).toMatchObject({
      params: {
        id: '123',
      },
    });

    expect(route.matcher('/posts/123')).toBe(false);
  });
});
