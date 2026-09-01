import { CompiledRouteRule } from '../../src/types/compiled-route-rule';

export function createRouteRule(overrides: Partial<CompiledRouteRule> = {}): CompiledRouteRule {
  return {
    routeRuleId: 'route-1',
    apiId: 'api-1',
    routePattern: '/users/:id',
    matcher: (path) => {
      const match = /^\/users\/([^/]+)$/.exec(path);

      if (!match) return false;

      return {
        path: match[0],
        params: {
          id: match[1],
        },
      };
    },
    specificityScore: 110,
    ...overrides,
  };
}
