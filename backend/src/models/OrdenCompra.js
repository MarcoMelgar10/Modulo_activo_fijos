import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ESTADOS_ORDEN = ['BORRADOR', 'ENVIADA', 'RECIBIDA', 'CANCELADA'];
export const CONDICIONES_PAGO = ['CONTADO', 'CREDITO'];

/**
 * Orden de compra (RF-COM-02 / diccionario §3.6.3.5, enriquecido).
 * Ciclo de vida: BORRADOR → ENVIADA → RECIBIDA (o CANCELADA).
 * `condicion_pago` decide el enlace contable en la recepción (Caja o Cuentas por Pagar).
 */
export const OrdenCompra = sequelize.define(
  'OrdenCompra',
  {
    id_orden: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    numero_orden: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fecha_emision: { type: DataTypes.DATEONLY, allowNull: false },
    condicion_pago: {
      type: DataTypes.ENUM(...CONDICIONES_PAGO),
      allowNull: false,
      defaultValue: 'CREDITO',
    },
    estado: { type: DataTypes.ENUM(...ESTADOS_ORDEN), allowNull: false, defaultValue: 'BORRADOR' },
    monto_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    fecha_recepcion: { type: DataTypes.DATEONLY, allowNull: true },
    id_asiento_compra: { type: DataTypes.INTEGER, allowNull: true },
    id_empleado: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'orden_compra',
    updatedAt: false,
  },
);
