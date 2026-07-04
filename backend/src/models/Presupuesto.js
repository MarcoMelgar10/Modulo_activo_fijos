import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ESTADOS_PRESUPUESTO = ['BORRADOR', 'APROBADO', 'RECHAZADO'];

/**
 * Presupuesto anual por gestión (RF-PRE-01/02). El CONTADOR lo define en estado
 * BORRADOR y el GERENTE lo aprueba o rechaza. Un presupuesto tiene líneas por
 * cuenta de INGRESO/GASTO con el monto planificado.
 */
export const Presupuesto = sequelize.define(
  'Presupuesto',
  {
    id_presupuesto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
    gestion: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.ENUM(...ESTADOS_PRESUPUESTO), allowNull: false, defaultValue: 'BORRADOR' },
    observacion: { type: DataTypes.TEXT, allowNull: true },
    id_empleado_creador: { type: DataTypes.INTEGER, allowNull: true },
    id_empleado_aprobador: { type: DataTypes.INTEGER, allowNull: true },
    fecha_aprobacion: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: 'presupuesto',
    updatedAt: false,
  },
);
