import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Línea de venta (diccionario §3.6.3.2). Cada línea referencia el lote del que se
 * descontó el stock (FEFO): una misma solicitud de producto puede generar varias
 * líneas si el stock se toma de más de un lote.
 */
export const DetalleVenta = sequelize.define(
  'DetalleVenta',
  {
    id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_venta: { type: DataTypes.INTEGER, allowNull: false },
    id_lote: { type: DataTypes.INTEGER, allowNull: false },
    id_producto: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  {
    tableName: 'detalle_venta',
    timestamps: false,
  },
);
