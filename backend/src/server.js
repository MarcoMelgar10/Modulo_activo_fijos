import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { assertDatabaseConnection } from './config/database.js';
import { connectRedis } from './config/redis.js';

async function bootstrap() {
  try {
    await assertDatabaseConnection();
    await connectRedis();
  } catch (err) {
    logger.error('Fallo al conectar dependencias (MySQL/Redis)', { error: err.message });
    // En desarrollo seguimos levantando el server para exponer /health en estado degradado.
    if (env.isProd) process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Servidor escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

bootstrap();
