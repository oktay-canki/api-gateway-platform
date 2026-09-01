const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "1h",
} as const;

export const config = {
  nodeEnv: env.NODE_ENV,
  db: {
    mongoUri: env.MONGODB_URI,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiration: env.JWT_EXPIRATION,
  },
} as const;
