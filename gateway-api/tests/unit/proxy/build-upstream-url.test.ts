import { describe, expect, it } from 'vitest';

import { buildUpstreamUrl } from '../../../src/proxy/build-upstream-url.js';

function createRequest(path: string, originalUrl: string) {
  return {
    path,
    originalUrl,
  } as any;
}

describe('buildUpstreamUrl', () => {
  it('combines the base URL with the request path', () => {
    const req = createRequest('/users/123', '/users/123');

    const result = buildUpstreamUrl('http://localhost:4001', req);

    expect(result).toBe('http://localhost:4001/users/123');
  });

  it('preserves the query string', () => {
    const req = createRequest('/users/123', '/users/123?page=2&active=true');

    const result = buildUpstreamUrl('http://localhost:4001', req);

    expect(result).toBe('http://localhost:4001/users/123?page=2&active=true');
  });

  it('handles a base URL that already ends with a slash', () => {
    const req = createRequest('/users/123', '/users/123');

    const result = buildUpstreamUrl('http://localhost:4001/', req);

    expect(result).toBe('http://localhost:4001/users/123');
  });
});
