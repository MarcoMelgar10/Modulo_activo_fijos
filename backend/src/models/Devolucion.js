import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Devolución de venta (RF-VEN-03 / diccionario §3.6.3.3). Repone el stock del lote
 * y genera un asiento de reversa. `monto_total` es el importe reembolsado.
 */
export const Devolucion = sequelize.define(
  'Devolucion',
  {
    id_devolucion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_venta: { type: DataTypes.INTEGER, allowNull: false },
    id_empleado: { type: DataTypes.INTEGER, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    motivo: { type: DataTypes.TEXT, allowNull: false },
    monto_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    id_asiento_devolucion: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'devolucion',
    updatedAt: false,
  },
);
