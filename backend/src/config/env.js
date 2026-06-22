import dotenv from 'dotenv';

dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    name: required('DB_NAME', 'contabilidad'),
    user: required('DB_USER', 'contabilidad'),
    password: required('DB_PASSWORD', 'contabilidad'),
  },

  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  jwt: {
    secret: required('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },

  security: {
    bcryptCost: Number(process.env.BCRYPT_COST ?? 10),
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5),
    lockMinutes: Number(process.env.LOCK_MINUTES ?? 15),
  },

  logLevel: process.env.LOG_LEVEL ?? 'info',

  get isProd() {
    return this.nodeEnv === 'production';
  },
};
