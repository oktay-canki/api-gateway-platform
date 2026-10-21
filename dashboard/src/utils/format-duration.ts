export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;

  const seconds = ms / 1000;

  if (seconds < 60) return `${seconds}s`;

  const minutes = seconds / 60;

  if (minutes < 60) return `${minutes}m`;

  return `${minutes / 60}h`;
}
