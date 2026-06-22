import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LineaAsiento = sequelize.define(
  'LineaAsiento',
  {
    id_linea: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_asiento: { type: DataTypes.INTEGER, allowNull: false },
    id_cuenta: { type: DataTypes.INTEGER, allowNull: false },
    descripcion: { type: DataTypes.STRING(200), allowNull: true },
    debe: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    haber: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'linea_asiento',
    timestamps: false,
  },
);
