import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Empleado = sequelize.define(
  'Empleado',
  {
    id_empleado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
    id_rol: { type: DataTypes.INTEGER, allowNull: false },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    apellido: { type: DataTypes.STRING(100), allowNull: false },
    usuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: { len: [4, 50], not: /\s/ },
    },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    intentos_fallidos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    bloqueado_hasta: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'empleado',
    updatedAt: false,
  },
);

// El hash nunca se serializa en respuestas JSON (defensa en profundidad).
Empleado.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};
