import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redisClient = createClient({ url: env.redisUrl });

redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Conexión a Redis establecida');
  }
}
