// Configuración para sequelize-cli (CommonJS, requerido por la CLI).
require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'contabilidad',
  password: process.env.DB_PASSWORD || 'contabilidad',
  database: process.env.DB_NAME || 'contabilidad',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  define: { underscored: true },
  // Registra los seeders ejecutados para que db:seed:all sea idempotente.
  seederStorage: 'sequelize',
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base,
};
