import express from 'express';
import healthRouter from './routes/health.js';
import { gatewayHandler } from './gateway/gateway-handler.js';
import { GatewayConfigCache } from './cache/gateway-config-cache.js';

export function createApp(configCache: GatewayConfigCache) {
  const app = express();

  // Public endpoints
  app.use('/health', healthRouter);

  app.get('/', (req, res) => {
    res.send('Gateway API');
  });

  // Gateway pipeline
  app.use(gatewayHandler(configCache));

  return app;
}
