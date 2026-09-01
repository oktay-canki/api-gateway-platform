import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const slidingWindowScriptPath = fileURLToPath(
  new URL('./scripts/sliding-window.lua', import.meta.url)
);

const tokenBucketScriptPath = fileURLToPath(new URL('./scripts/token-bucket.lua', import.meta.url));

export const slidingWindowScript = await readFile(slidingWindowScriptPath, 'utf8');

export const tokenBucketScript = await readFile(tokenBucketScriptPath, 'utf8');
