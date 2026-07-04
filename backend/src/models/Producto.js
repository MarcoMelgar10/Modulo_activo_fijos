import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Producto del catálogo (RF-INV-01 / diccionario §3.6.2.2). El código de barras
 * es único. Los precios se guardan como DECIMAL(10,2).
 */
export const Producto = sequelize.define(
  'Producto',
  {
    id_producto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_categoria: { type: DataTypes.INTEGER, allowNull: false },
    codigo_barras: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
    nombre: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    unidad_medida: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'UND' },
    precio_compra: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'producto',
    timestamps: false,
  },
);
