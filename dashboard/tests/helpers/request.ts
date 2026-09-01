export function createJsonRequest(
  url: string,
  options: {
    method: string;
    body?: unknown;
    token?: string;
  },
) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options.token) {
    headers.set("Cookie", `auth-token=${options.token}`);
  }

  return new Request(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}
