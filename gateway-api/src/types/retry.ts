export type RetryPolicy = {
  maxRetries: number;
  retryDelayMs: number;
};

export type ApiRetryPolicy = {
  enabled: boolean;
} & RetryPolicy;
