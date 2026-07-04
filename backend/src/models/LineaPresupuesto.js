import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/** Línea de presupuesto: monto planificado para una cuenta (INGRESO/GASTO). */
export const LineaPresupuesto = sequelize.define(
  'LineaPresupuesto',
  {
    id_linea_presupuesto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_presupuesto: { type: DataTypes.INTEGER, allowNull: false },
    id_cuenta: { type: DataTypes.INTEGER, allowNull: false },
    monto_planificado: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'linea_presupuesto',
    timestamps: false,
  },
);
