import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/** Línea de devolución (diccionario §3.6.3.4). */
export const DetalleDevolucion = sequelize.define(
  'DetalleDevolucion',
  {
    id_detalle_dev: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_devolucion: { type: DataTypes.INTEGER, allowNull: false },
    id_detalle_venta: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_dev: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'detalle_devolucion',
    timestamps: false,
  },
);
