import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createTestApp, MOCK_BACKEND_URL, TEST_API_KEY } from '../../helpers/gateway.js';

describe('forwardRequest integration', () => {
  it('proxies a normal request to the upstream', async () => {
    const app = createTestApp();

    const response = await request(app).get('/api/test/echo').set('X-API-Key', TEST_API_KEY);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      path: '/echo',
      originalUrl: '/api/test/echo',
      query: {},
    });
  });

  it('forwards the path and query string to the upstream', async () => {
    const app = createTestApp();

    const response = await request(app)
      .get('/api/test/echo?name=alice&limit=10')
      .set('X-API-Key', TEST_API_KEY);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      path: '/echo',
      originalUrl: '/api/test/echo?name=alice&limit=10',
      query: {
        name: 'alice',
        limit: '10',
      },
    });
  });

  it('fails when the upstream exceeds the configured timeout', async () => {
    const app = createTestApp({
      timeoutMs: 100,
    });

    const response = await request(app).get('/api/test/timeout').set('X-API-Key', TEST_API_KEY);
    expect(response.status).toBe(502);
  });

  it('retries a failed upstream request and succeeds', async () => {
    await request(MOCK_BACKEND_URL).post('/api/test/reset');
    const app = createTestApp({
      retryPolicy: {
        enabled: true,
        maxRetries: 1,
        retryDelayMs: 0,
      },
    });

    const response = await request(app).get('/api/test/fail-once').set('X-API-Key', TEST_API_KEY);

    expect(response.status).toBe(200);
  });

  it('forwards an upstream 500 response to the client', async () => {
    const app = createTestApp();

    const response = await request(app).get('/api/test/fail').set('X-API-Key', TEST_API_KEY);

    expect(response.status).toBe(500);
  });
});
