import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ESTADOS_CIERRE = ['ABIERTO', 'CERRADO'];

/**
 * Cierre de gestión (RF-CON-05). Un registro por período cerrado.
 * Cierre anual: periodo_mes = 0 (0 = gestión completa; 1-12 reservado para un
 * futuro cierre mensual). Guarda un snapshot del resultado y la referencia al
 * asiento de cierre generado.
 */
export const CierreContable = sequelize.define(
  'CierreContable',
  {
    id_cierre: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    periodo_anio: { type: DataTypes.INTEGER, allowNull: false },
    periodo_mes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: true },
    estado: { type: DataTypes.ENUM(...ESTADOS_CIERRE), allowNull: false, defaultValue: 'CERRADO' },
    fecha_cierre: { type: DataTypes.DATEONLY, allowNull: false },
    total_ingresos: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    total_gastos: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    resultado: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    id_asiento_cierre: { type: DataTypes.INTEGER, allowNull: true },
    id_empleado: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'cierre_contable',
    updatedAt: false,
  },
);
