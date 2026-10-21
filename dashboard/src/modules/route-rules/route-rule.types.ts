import type { HttpMethod, RateLimit } from "@/modules/apis/api.types";

export type RouteRuleResponse = {
  id: string;
  apiId: string;
  routePattern: string;
  rateLimit?: RateLimit;
  allowedMethods?: HttpMethod[];
  timeoutMs?: number;
  retryPolicy?: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
  };
  createdAt: string;
  updatedAt: string;
};
