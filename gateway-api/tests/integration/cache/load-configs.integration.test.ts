import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { GatewayConfigCache } from '../../../src/cache/gateway-config-cache.js';
import { getDb } from '../../../src/lib/mongodb.js';
import { loadGatewayConfig } from '../../../src/cache/load-configs.js';

describe('loadGatewayConfig', () => {
  it('loads APIs and route rules into the cache and sorts routes by specificity', async () => {
    const db = await getDb();

    const apiId = new ObjectId();

    await db.collection('apis').insertOne({
      _id: apiId,
      baseUrl: 'http://localhost:4001',
      apiKeyHash: 'test-api-key-hash',
      allowedMethods: ['GET', 'POST'],
      rateLimit: {
        enabled: true,
        algorithm: 'sliding-window',
        maxRequests: 5,
        windowMs: 6000,
      },
      timeoutMs: 5000,
      retryPolicy: {
        enabled: true,
        maxRetries: 2,
        retryDelayMs: 500,
      },
    });

    await db.collection('routerules').insertMany([
      {
        _id: new ObjectId(),
        apiId,
        routePattern: '/users/:id',
        allowedMethods: ['GET'],
      },
      {
        _id: new ObjectId(),
        apiId,
        routePattern: '/users/profile',
        allowedMethods: ['GET'],
      },
    ]);

    const cache = new GatewayConfigCache();

    await loadGatewayConfig(cache);

    const config = cache.get('test-api-key-hash');

    expect(config).toBeDefined();
    expect(config?.api.apiId).toBe(apiId.toString());
    expect(config?.routes).toHaveLength(2);

    expect(config?.routes[0].routePattern).toBe('/users/profile');
    expect(config?.routes[1].routePattern).toBe('/users/:id');
  });
});
