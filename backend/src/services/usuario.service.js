import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';

const COST = Number(process.env.BCRYPT_COST || 10);

/**
 * Gestión de usuarios (RF-USR-02/04). Solo el GERENTE la opera (RBAC en la ruta).
 * - Crea usuarios asignándoles rol (de los roles del seeder) y contraseña inicial.
 * - Edita datos/rol y activa/desactiva (baja lógica).
 * Los roles NO se crean aquí: siguen viniendo del seeder.
 */
export function createUsuarioService({ repo = usuarioRepository, hasher = bcrypt } = {}) {
  return {
    listar() {
      return repo.findAll();
    },

    listarRoles() {
      return repo.findRoles();
    },

    async obtener(id) {
      const usuario = await repo.findById(id);
      if (!usuario) throw ApiError.notFound('Usuario no encontrado');
      return usuario;
    },

    async crear({ nombre, apellido, usuario, password, id_rol, id_sucursal = 1 }) {
      if (await repo.findByUsuario(usuario)) {
        throw ApiError.conflict(`El usuario "${usuario}" ya existe`);
      }
      const rol = await repo.findRolById(id_rol);
      if (!rol) throw ApiError.badRequest('El rol indicado no existe');

      const password_hash = await hasher.hash(password, COST);
      const creado = await repo.create({
        nombre,
        apellido,
        usuario,
        password_hash,
        id_rol,
        id_sucursal,
        activo: true,
        intentos_fallidos: 0,
      });
      return repo.findById(creado.id_empleado);
    },

    async actualizar(id, { nombre, apellido, id_rol, activo, password }, actorId) {
      const usuario = await this.obtener(id);
      const updates = {};
      if (nombre !== undefined) updates.nombre = nombre;
      if (apellido !== undefined) updates.apellido = apellido;
      if (id_rol !== undefined) {
        const rol = await repo.findRolById(id_rol);
        if (!rol) throw ApiError.badRequest('El rol indicado no existe');
        updates.id_rol = id_rol;
      }
      if (activo !== undefined) {
        if (activo === false && Number(id) === Number(actorId)) {
          throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
        }
        updates.activo = activo;
      }
      if (password) {
        updates.password_hash = await hasher.hash(password, COST);
        updates.intentos_fallidos = 0;
        updates.bloqueado_hasta = null;
      }
      await usuario.update(updates);
      return repo.findById(id);
    },

    async cambiarEstado(id, activo, actorId) {
      if (activo === false && Number(id) === Number(actorId)) {
        throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
      }
      const usuario = await this.obtener(id);
      await usuario.update({ activo });
      return repo.findById(id);
    },
  };
}

export const usuarioService = createUsuarioService();
