import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Traspaso = sequelize.define(
  'Traspaso',
  {
    id_traspaso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_sucursal_origen: { type: DataTypes.INTEGER, allowNull: false },
    id_sucursal_destino: { type: DataTypes.INTEGER, allowNull: false },
    id_empleado: { type: DataTypes.INTEGER, allowNull: false },
    id_empleado_recibe: { type: DataTypes.INTEGER, allowNull: true },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'EN_TRANSITO', 'RECIBIDO', 'CANCELADO'),
      allowNull: false, defaultValue: 'PENDIENTE',
    },
    motivo: { type: DataTypes.STRING(250), allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false },
    fecha_envio: { type: DataTypes.DATE, allowNull: true },
    fecha_recepcion: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'traspaso',
    timestamps: false,
  },
);
