import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const DispositivoBiometrico = sequelize.define(
  'DispositivoBiometrico',
  {
    dispositivo_id: { type: DataTypes.STRING(50), primaryKey: true },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    ubicacion: { type: DataTypes.STRING(150), allowNull: true },
    secret_hash: { type: DataTypes.STRING(255), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'dispositivo_biometrico',
    timestamps: false,
  },
);
