import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const TIPOS_ORIGEN = ['VENTA', 'COMPRA', 'DEVOLUCION', 'PAGO', 'MANUAL', 'CIERRE'];
export const ESTADOS_ASIENTO = ['BORRADOR', 'CONFIRMADO', 'ANULADO'];

export const AsientoContable = sequelize.define(
  'AsientoContable',
  {
    id_asiento: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    numero_asiento: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    concepto: { type: DataTypes.TEXT, allowNull: false },
    tipo_origen: { type: DataTypes.ENUM(...TIPOS_ORIGEN), allowNull: false, defaultValue: 'MANUAL' },
    id_referencia: { type: DataTypes.INTEGER, allowNull: true },
    estado: { type: DataTypes.ENUM(...ESTADOS_ASIENTO), allowNull: false, defaultValue: 'BORRADOR' },
  },
  {
    tableName: 'asiento_contable',
    updatedAt: false,
  },
);
