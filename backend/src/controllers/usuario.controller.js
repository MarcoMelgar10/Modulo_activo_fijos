import { asyncHandler } from '../utils/asyncHandler.js';
import { usuarioService } from '../services/usuario.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const usuarioController = {
  listar: asyncHandler(async (req, res) => {
    const usuarios = await usuarioService.listar();
    res.json({ usuarios });
  }),

  roles: asyncHandler(async (req, res) => {
    const roles = await usuarioService.listarRoles();
    res.json({ roles });
  }),

  obtener: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.obtener(Number(req.params.id));
    res.json({ usuario });
  }),

  crear: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.crear(req.body);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_USUARIO:${usuario.usuario}:${usuario.rol?.nombre}`,
      modulo: 'USUARIOS',
    });
    res.status(201).json({ usuario });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.actualizar(Number(req.params.id), req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `EDITAR_USUARIO:${usuario.usuario}`,
      modulo: 'USUARIOS',
    });
    res.json({ usuario });
  }),

  cambiarEstado: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.cambiarEstado(Number(req.params.id), req.body.activo, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `${req.body.activo ? 'ALTA' : 'BAJA'}_USUARIO:${usuario.usuario}`,
      modulo: 'USUARIOS',
    });
    res.json({ usuario });
  }),
};
