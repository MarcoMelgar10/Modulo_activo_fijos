import { sequelize } from '../config/database.js';
import { redisClient } from '../config/redis.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const healthController = {
  check: asyncHandler(async (req, res) => {
    const checks = { server: 'ok', database: 'down', redis: 'down' };

    try {
      await sequelize.authenticate();
      checks.database = 'ok';
    } catch {
      checks.database = 'down';
    }

    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        checks.redis = 'ok';
      }
    } catch {
      checks.redis = 'down';
    }

    const healthy = checks.database === 'ok' && checks.redis === 'ok';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  }),
};
