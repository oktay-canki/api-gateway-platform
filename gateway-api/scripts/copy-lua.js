import { cp } from 'node:fs/promises';

await cp('src/rate-limit/scripts', 'dist/rate-limit/scripts', {
  recursive: true,
});
