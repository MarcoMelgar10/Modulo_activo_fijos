import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Proveedor (RF-COM-01 / diccionario §3.6.2.3). Entidad comercial que suministra
 * productos. El NIT es la clave tributaria única.
 */
export const Proveedor = sequelize.define(
  'Proveedor',
  {
    id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    razon_social: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    nit: { type: DataTypes.STRING(20), allowNull: false, unique: true, validate: { notEmpty: true } },
    contacto: { type: DataTypes.STRING(100), allowNull: true },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(120), allowNull: true, validate: { isEmail: true } },
    ciudad: { type: DataTypes.STRING(80), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'proveedor',
    updatedAt: false,
  },
);
