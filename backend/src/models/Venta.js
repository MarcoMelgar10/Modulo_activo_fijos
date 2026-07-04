import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const METODOS_PAGO_VENTA = ['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'QR'];
export const ESTADOS_VENTA = ['COMPLETADA', 'ANULADA', 'DEVOLUCION_PARCIAL'];

/**
 * Venta POS (RF-VEN-01 / diccionario §3.6.3.1). Se registra como COMPLETADA al
 * momento del cobro. `monto_total = monto_subtotal − monto_descuento`.
 */
export const Venta = sequelize.define(
  'Venta',
  {
    id_venta: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    id_cajero: { type: DataTypes.INTEGER, allowNull: false },
    numero_venta: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    monto_subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    monto_descuento: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    monto_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    metodo_pago: { type: DataTypes.ENUM(...METODOS_PAGO_VENTA), allowNull: false, defaultValue: 'EFECTIVO' },
    estado: { type: DataTypes.ENUM(...ESTADOS_VENTA), allowNull: false, defaultValue: 'COMPLETADA' },
    id_asiento_venta: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'venta',
    updatedAt: false,
    createdAt: 'fecha_hora',
  },
);
