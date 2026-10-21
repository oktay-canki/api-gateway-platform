import type { Types } from "mongoose";

import type ITimestamps from "@/interfaces/ITimestamps";
import type { HttpMethod, RateLimit } from "@/modules/apis/api.types";

export interface IRouteRuleDocument extends ITimestamps {
  apiId: Types.ObjectId;

  routePattern: string;

  rateLimit?: RateLimit;

  allowedMethods?: HttpMethod[];

  timeoutMs?: number;

  retryPolicy?: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
  };
}
