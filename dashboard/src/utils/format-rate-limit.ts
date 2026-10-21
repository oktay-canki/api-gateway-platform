import { ApiRateLimit } from "@/modules/apis/api.types";

export function formatRateLimit(rateLimit: ApiRateLimit) {
  if (!rateLimit.enabled) {
    return "Disabled";
  }

  if (rateLimit.algorithm === "sliding-window") {
    return `${rateLimit.maxRequests} requests / ${rateLimit.windowMs}ms`;
  }

  return `${rateLimit.capacity} capacity · ${rateLimit.refillRate} / ${rateLimit.refillIntervalMs}ms`;
}
