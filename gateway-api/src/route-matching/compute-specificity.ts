export function computeSpecificity(pattern: string): number {
  const segments = pattern.split('/').filter(Boolean);

  let score = 0;
  for (const segment of segments) {
    if (segment.startsWith('*')) {
      score += 1; // wildcard — least specific
    } else if (segment.startsWith(':')) {
      score += 10; // named param — medium
    } else {
      score += 100; // static segment — most specific
    }
  }
  return score;
}
