import type { Request } from 'express';

export function buildUpstreamUrl(baseUrl: string, req: Request): string {
  const target = new URL(baseUrl);

  target.pathname = joinPaths(target.pathname, req.path);
  target.search = req.originalUrl.includes('?')
    ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
    : '';

  return target.toString();
}

function joinPaths(basePath: string, requestPath: string): string {
  return `${basePath.replace(/\/$/, '')}/${requestPath.replace(/^\//, '')}`;
}
