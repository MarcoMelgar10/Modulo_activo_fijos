import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Registro inmutable de acciones (RF-REP-03 / RNF-06). Solo se inserta;
 * no se actualiza ni elimina desde la aplicación.
 */
export const LogAuditoria = sequelize.define(
  'LogAuditoria',
  {
    id_log: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    id_empleado: { type: DataTypes.INTEGER, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    fecha_hora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    accion: { type: DataTypes.STRING(100), allowNull: false },
    modulo: { type: DataTypes.STRING(50), allowNull: false },
  },
  {
    tableName: 'log_auditoria',
    timestamps: false,
  },
);
