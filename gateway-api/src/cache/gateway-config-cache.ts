import type { ApiConfig } from '../types/api-config.js';
import { CompiledRouteRule } from '../types/compiled-route-rule.js';

export interface IGatewayConfig {
  api: ApiConfig;
  routes: CompiledRouteRule[];
}

export class GatewayConfigCache {
  private configs = new Map<string, IGatewayConfig>();

  get(apiKeyHash: string): IGatewayConfig | undefined {
    return this.configs.get(apiKeyHash);
  }

  replace(configs: Map<string, IGatewayConfig>): void {
    this.configs = configs;
  }

  size(): number {
    return this.configs.size;
  }
}
