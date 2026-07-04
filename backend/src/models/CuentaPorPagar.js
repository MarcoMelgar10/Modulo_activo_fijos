import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ESTADOS_CXP = ['PENDIENTE', 'PARCIAL', 'PAGADA'];

/**
 * Cuenta por pagar (RF-COM-04). Deuda con un proveedor, normalmente originada al
 * recibir una orden de compra a crédito. `saldo_pendiente` disminuye con cada
 * pago hasta llegar a 0 (estado PAGADA).
 */
export const CuentaPorPagar = sequelize.define(
  'CuentaPorPagar',
  {
    id_cxp: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
    id_orden: { type: DataTypes.INTEGER, allowNull: true },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: true },
    monto_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    saldo_pendiente: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    estado: { type: DataTypes.ENUM(...ESTADOS_CXP), allowNull: false, defaultValue: 'PENDIENTE' },
    fecha_emision: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: 'cuenta_por_pagar',
    updatedAt: false,
  },
);
