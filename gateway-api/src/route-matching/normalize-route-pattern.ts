export function normalizeRoutePattern(pattern: string): string {
  let wildcardIndex = 0;

  return pattern
    .split('/')
    .map((segment) => {
      if (segment === '*') {
        return `*wildcard${wildcardIndex++}`;
      }

      return segment;
    })
    .join('/');
}
