import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const AccesoBiometrico = sequelize.define(
  'AccesoBiometrico',
  {
    id_acceso: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    id_empleado: { type: DataTypes.INTEGER, allowNull: false },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    fecha_hora: { type: DataTypes.DATE, allowNull: false },
    tipo_movimiento: { type: DataTypes.ENUM('ENTRADA', 'SALIDA'), allowNull: false },
    resultado: { type: DataTypes.BOOLEAN, allowNull: false },
    dispositivo_id: { type: DataTypes.STRING(50), allowNull: false },
  },
  {
    tableName: 'acceso_biometrico',
    timestamps: false,
  },
);
