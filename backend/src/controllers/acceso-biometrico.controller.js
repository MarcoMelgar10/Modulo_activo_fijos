import { asyncHandler } from '../utils/asyncHandler.js';
import { accesoBiometricoService } from '../services/acceso-biometrico.service.js';
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const accesoBiometricoController = {
  listar: asyncHandler(async (req, res) => {
    const accesos = await accesoBiometricoService.listar(req.query, req.user);
    res.json({ accesos });
  }),

  obtener: asyncHandler(async (req, res) => {
    const acceso = await accesoBiometricoService.obtener(Number(req.params.id), req.user);
    res.json({ acceso });
  }),

  registrarEvento: asyncHandler(async (req, res) => {
    const dispositivo_id = req.headers['x-device-id'];
    const secret = req.headers['x-device-secret'];
    if (!dispositivo_id || !secret) {
      return res.status(401).json({ error: 'Headers X-Device-Id y X-Device-Secret requeridos' });
    }
    const { id_empleado, tipo_movimiento, fecha_hora } = req.body;
    const resultado = await accesoBiometricoService.registrarEventoDispositivo(
      dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, secret, usuarioRepository,
    );
    res.json(resultado);
  }),

  simular: asyncHandler(async (req, res) => {
    const { dispositivo_id, id_empleado, tipo_movimiento, fecha_hora } = req.body;
    const resultado = await accesoBiometricoService.simular(
      dispositivo_id, id_empleado, tipo_movimiento, fecha_hora, usuarioRepository,
    );
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `SIMULAR_ACCESO_BIOMETRICO:${resultado.acceso?.id_acceso}`, modulo: 'BIOMETRIA',
    });
    res.json(resultado);
  }),
};
