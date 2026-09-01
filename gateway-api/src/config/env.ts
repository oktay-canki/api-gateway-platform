import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV ?? 'development';

dotenv.config({ path: '.env', quiet: true });
dotenv.config({ path: '.env.local', override: true, quiet: true });

if (nodeEnv === 'test') {
  dotenv.config({ path: '.env.test', override: true, quiet: true });
}

interface EnvVarSpec {
  key: string;
  required: boolean;
  defaultValue?: string;
}

const envVars: EnvVarSpec[] = [
  { key: 'NODE_ENV', required: false, defaultValue: 'development' },
  { key: 'PORT', required: false, defaultValue: '4000' },
  { key: 'REDIS_URL', required: true },
  { key: 'MONGODB_URI', required: true },
  { key: 'MONGODB_DB_NAME', required: true },
];

function loadEnv(): Record<string, string> {
  const missing: string[] = [];
  const values: Record<string, string> = {};

  for (const spec of envVars) {
    const raw = process.env[spec.key];

    if (raw === undefined || raw === '') {
      if (spec.required) {
        missing.push(spec.key);
      } else {
        values[spec.key] = spec.defaultValue ?? '';
      }
      continue;
    }

    values[spec.key] = raw;
  }

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `\n[config] Missing required environment variable(s):\n` +
        missing.map((k) => `  - ${k}`).join('\n') +
        `\n\nCheck your .env file (see .env.example) or deployment environment.\n`
    );
    process.exit(1);
  }

  return values;
}

const raw = loadEnv();

export const envConfig = {
  port: Number(raw.PORT),
  nodeEnv: raw.NODE_ENV as 'development' | 'production' | 'test',
  redisUrl: raw.REDIS_URL as string,
  mongoDbUri: raw.MONGODB_URI as string,
  mongoDbDbName: raw.MONGODB_DB_NAME as string,
} as const;
