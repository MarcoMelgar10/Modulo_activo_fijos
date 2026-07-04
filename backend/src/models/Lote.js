import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Lote de inventario (RF-INV-02 / diccionario §3.6.2.4). Se genera en la
 * recepción de una orden de compra (RF-COM-03): cada línea recibida crea un lote
 * con su número, cantidad y fecha de vencimiento (base del método FEFO).
 */
export const Lote = sequelize.define(
  'Lote',
  {
    id_lote: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_producto: { type: DataTypes.INTEGER, allowNull: false },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    id_proveedor: { type: DataTypes.INTEGER, allowNull: true },
    numero_lote: { type: DataTypes.STRING(50), allowNull: false },
    cantidad_inicial: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_actual: { type: DataTypes.INTEGER, allowNull: false },
    fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'lote',
    timestamps: false,
  },
);
