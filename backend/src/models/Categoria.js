import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/** Categoría de producto (diccionario §3.6.2.1). */
export const Categoria = sequelize.define(
  'Categoria',
  {
    id_categoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true, validate: { notEmpty: true } },
    descripcion: { type: DataTypes.STRING(200), allowNull: true },
  },
  {
    tableName: 'categoria',
    timestamps: false,
  },
);
