import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Sucursal = sequelize.define(
  'Sucursal',
  {
    id_sucursal: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    ciudad: { type: DataTypes.STRING(80), allowNull: false },
    direccion: { type: DataTypes.STRING(200), allowNull: false },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    estado: {
      type: DataTypes.ENUM('ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO'),
      allowNull: false,
      defaultValue: 'ACTIVA',
    },
  },
  {
    tableName: 'sucursal',
    updatedAt: false,
  },
);
