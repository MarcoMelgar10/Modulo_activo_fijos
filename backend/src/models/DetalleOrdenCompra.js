import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Línea de una orden de compra (diccionario §3.6.3.6, enriquecido con precio y
 * subtotal para calcular el monto total de la orden).
 */
export const DetalleOrdenCompra = sequelize.define(
  'DetalleOrdenCompra',
  {
    id_detalle_oc: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_orden: { type: DataTypes.INTEGER, allowNull: false },
    id_producto: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  },
  {
    tableName: 'detalle_orden_compra',
    timestamps: false,
  },
);
