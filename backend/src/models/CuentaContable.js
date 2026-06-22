import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const TIPOS_CUENTA = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'];

export const CuentaContable = sequelize.define(
  'CuentaContable',
  {
    id_cuenta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true },
    },
    nombre: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    tipo: { type: DataTypes.ENUM(...TIPOS_CUENTA), allowNull: false, validate: { isIn: [TIPOS_CUENTA] } },
    id_cuenta_padre: { type: DataTypes.INTEGER, allowNull: true },
    nivel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    permite_movimiento: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'cuenta_contable',
    updatedAt: false,
  },
);

// Auto-relación (jerarquía del plan de cuentas).
CuentaContable.hasMany(CuentaContable, { foreignKey: 'id_cuenta_padre', as: 'subcuentas' });
CuentaContable.belongsTo(CuentaContable, { foreignKey: 'id_cuenta_padre', as: 'padre' });
