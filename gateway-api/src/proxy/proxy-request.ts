import type { Request } from 'express';
import type { ServerResponse } from 'node:http';
import httpProxy from 'http-proxy';
import { buildUpstreamUrl } from './build-upstream-url.js';
import { ProxyRequestError } from '../errors/proxy-request-error.js';

const proxy = httpProxy.createProxyServer();

export function proxyRequest(req: Request, res: ServerResponse): Promise<void> {
  const routeConfig = req.resolvedRouteConfig;

  if (!routeConfig) {
    return Promise.reject(new Error('Resolved route config is missing'));
  }

  const target = buildUpstreamUrl(routeConfig.baseUrl, req);

  return new Promise((resolve, reject) => {
    proxy.web(
      req,
      res,
      {
        target,
        changeOrigin: true,
        proxyTimeout: routeConfig.timeoutMs,
        ignorePath: true,
      },
      (error) => {
        if (error) {
          reject(new ProxyRequestError('Upstream request failed', { cause: error }));
          return;
        }

        resolve();
      }
    );
  });
}
