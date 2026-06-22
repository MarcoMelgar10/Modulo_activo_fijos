import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ROLES = ['GERENTE', 'CAJERO', 'BODEGUERO', 'CONTADOR'];

export const Rol = sequelize.define(
  'Rol',
  {
    id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { isIn: [ROLES] },
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'rol',
    timestamps: false,
  },
);
