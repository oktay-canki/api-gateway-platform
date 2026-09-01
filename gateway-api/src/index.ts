import { envConfig } from './config/env.js';
import { createApp } from './app.js';
import { GatewayConfigCache } from './cache/gateway-config-cache.js';
import { loadGatewayConfig } from './cache/load-configs.js';

const configCache = new GatewayConfigCache();

await loadGatewayConfig(configCache);

const app = createApp(configCache);

app.listen(envConfig.port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${envConfig.port}`);
});
