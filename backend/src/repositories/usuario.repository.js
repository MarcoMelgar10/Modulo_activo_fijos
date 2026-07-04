import { Empleado, Rol, Sucursal } from '../models/index.js';

const includes = [
  { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
  { model: Sucursal, as: 'sucursal', attributes: ['id_sucursal', 'nombre'] },
];

/**
 * Acceso a datos para la gestión de usuarios (empleados). El hash de contraseña
 * nunca se serializa: el modelo Empleado lo elimina en toJSON().
 */
export const usuarioRepository = {
  findAll() {
    return Empleado.findAll({ include: includes, order: [['id_empleado', 'ASC']] });
  },

  findById(id) {
    return Empleado.findByPk(id, { include: includes });
  },

  findByUsuario(usuario) {
    return Empleado.findOne({ where: { usuario } });
  },

  create(data) {
    return Empleado.create(data);
  },

  findRoles() {
    return Rol.findAll({ order: [['id_rol', 'ASC']] });
  },

  findRolById(id) {
    return Rol.findByPk(id);
  },
};
