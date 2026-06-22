import { Sequelize } from 'sequelize';
import { env } from './env.js';
import { logger } from './logger.js';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.isProd ? false : (msg) => logger.debug(msg),
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

export async function assertDatabaseConnection() {
  await sequelize.authenticate();
  logger.info('Conexión a MySQL establecida');
}
