import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const DetalleTraspaso = sequelize.define(
  'DetalleTraspaso',
  {
    id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_traspaso: { type: DataTypes.INTEGER, allowNull: false },
    id_lote: { type: DataTypes.INTEGER, allowNull: false },
    id_lote_destino: { type: DataTypes.INTEGER, allowNull: true },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'detalle_traspaso',
    timestamps: false,
  },
);
