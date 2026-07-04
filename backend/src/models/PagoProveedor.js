import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA'];

/**
 * Pago (parcial o total) de una cuenta por pagar (RF-COM-04). Cada pago genera su
 * propio asiento contable (Cuentas por Pagar / Caja), referenciado en `id_asiento`.
 */
export const PagoProveedor = sequelize.define(
  'PagoProveedor',
  {
    id_pago: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cxp: { type: DataTypes.INTEGER, allowNull: false },
    monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    fecha_pago: { type: DataTypes.DATEONLY, allowNull: false },
    metodo_pago: { type: DataTypes.ENUM(...METODOS_PAGO), allowNull: false, defaultValue: 'EFECTIVO' },
    id_asiento: { type: DataTypes.INTEGER, allowNull: true },
    id_empleado: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'pago_proveedor',
    updatedAt: false,
  },
);
