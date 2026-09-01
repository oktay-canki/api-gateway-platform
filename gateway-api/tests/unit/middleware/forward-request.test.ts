import { beforeEach, describe, expect, it, vi } from 'vitest';

import { proxyRequest } from '../../../src/proxy/proxy-request.js';
import { forwardRequest } from '../../../src/middleware/forward-request.js';

import { createNext, createRequest, createResponse } from '../../helpers/express.js';

vi.mock('../../../src/proxy/proxy-request.js', () => ({
  proxyRequest: vi.fn(),
}));

const mockedProxyRequest = vi.mocked(proxyRequest);

describe('forwardRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successful request, next is not called because proxy handled it', async () => {
    mockedProxyRequest.mockResolvedValue(undefined);

    const req = createRequest();
    const res = createResponse();
    const next = createNext();

    await forwardRequest(req, res, next);

    expect(mockedProxyRequest).toHaveBeenCalledTimes(1);
    expect(mockedProxyRequest).toHaveBeenCalledWith(req, res);
    expect(next).not.toHaveBeenCalled();
  });

  it('proxy failure with no retry, error is passed to next', async () => {
    const error = new Error('Proxy failed');

    mockedProxyRequest.mockRejectedValue(error);

    const req = createRequest({
      resolvedRouteConfig: {
        ...createRequest().resolvedRouteConfig!,
        retryPolicy: undefined,
      },
    });

    const res = createResponse();
    const next = createNext();

    await forwardRequest(req, res, next);

    expect(mockedProxyRequest).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('proxy failure with retries, retries the expected number of times', async () => {
    const error = new Error('Proxy failed');

    mockedProxyRequest.mockRejectedValue(error);

    const req = createRequest({
      resolvedRouteConfig: {
        ...createRequest().resolvedRouteConfig!,
        retryPolicy: {
          maxRetries: 2,
          retryDelayMs: 0,
        },
      },
    });

    const res = createResponse();
    const next = createNext();

    await forwardRequest(req, res, next);

    // Initial attempt + 2 retries.
    expect(mockedProxyRequest).toHaveBeenCalledTimes(3);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('retry delay is respected', async () => {
    vi.useFakeTimers();

    try {
      const error = new Error('Proxy failed');

      mockedProxyRequest.mockRejectedValue(error);

      const req = createRequest({
        resolvedRouteConfig: {
          ...createRequest().resolvedRouteConfig!,
          retryPolicy: {
            maxRetries: 1,
            retryDelayMs: 1000,
          },
        },
      });

      const res = createResponse();
      const next = createNext();

      const promise = forwardRequest(req, res, next);

      // First attempt has happened and is waiting for the retry delay.
      await vi.advanceTimersByTimeAsync(999);

      expect(mockedProxyRequest).toHaveBeenCalledTimes(1);

      // The delay has elapsed, so the retry can happen.
      await vi.advanceTimersByTimeAsync(1);

      await promise;

      expect(mockedProxyRequest).toHaveBeenCalledTimes(2);
      expect(next).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('non-retryable method does not retry', async () => {
    const error = new Error('Proxy failed');

    mockedProxyRequest.mockRejectedValue(error);

    const req = createRequest({
      method: 'POST',
    });

    const res = createResponse();
    const next = createNext();

    await forwardRequest(req, res, next);

    expect(mockedProxyRequest).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('retry eventually succeeds', async () => {
    const error = new Error('Temporary proxy failure');

    mockedProxyRequest.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);

    const req = createRequest({
      resolvedRouteConfig: {
        ...createRequest().resolvedRouteConfig!,
        retryPolicy: {
          maxRetries: 2,
          retryDelayMs: 0,
        },
      },
    });

    const res = createResponse();
    const next = createNext();

    await forwardRequest(req, res, next);

    expect(mockedProxyRequest).toHaveBeenCalledTimes(2);
    expect(next).not.toHaveBeenCalled();
  });

  it('all retries exhausted, final error is passed to next', async () => {
    const firstError = new Error('First failure');
    const secondError = new Error('Second failure');
    const finalError = new Error('Final failure');

    mockedProxyRequest
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError)
      .mockRejectedValueOnce(finalError);

    const req = createRequest({
      resolvedRouteConfig: {
        ...createRequest().resolvedRouteConfig!,
        retryPolicy: {
          maxRetries: 2,
          retryDelayMs: 0,
        },
      },
    });

    const res = createResponse();
    const next = createNext();

    await forwardRequest(req, res, next);

    // Initial attempt + 2 retries.
    expect(mockedProxyRequest).toHaveBeenCalledTimes(3);

    // The error from the final attempt is forwarded.
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(finalError);
  });
});
