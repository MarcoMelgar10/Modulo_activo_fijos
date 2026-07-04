import { asyncHandler } from '../utils/asyncHandler.js';
import { dispositivoBiometricoService } from '../services/dispositivo-biometrico.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const dispositivoBiometricoController = {
  listar: asyncHandler(async (req, res) => {
    const id_sucursal = req.user.rol === 'GERENTE' ? undefined : Number(req.user.id_sucursal);
    const dispositivos = await dispositivoBiometricoService.listar(id_sucursal);
    res.json({ dispositivos });
  }),

  obtener: asyncHandler(async (req, res) => {
    const dispositivo = await dispositivoBiometricoService.obtener(req.params.id);
    res.json({ dispositivo });
  }),

  crear: asyncHandler(async (req, res) => {
    const dispositivo = await dispositivoBiometricoService.crear(req.body);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `CREAR_DISPOSITIVO_BIOMETRICO:${dispositivo.dispositivo_id}`, modulo: 'BIOMETRIA',
    });
    res.status(201).json({ dispositivo });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const dispositivo = await dispositivoBiometricoService.actualizar(req.params.id, req.body);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `EDITAR_DISPOSITIVO_BIOMETRICO:${req.params.id}`, modulo: 'BIOMETRIA',
    });
    res.json({ dispositivo });
  }),

  cambiarEstado: asyncHandler(async (req, res) => {
    const dispositivo = await dispositivoBiometricoService.cambiarEstado(req.params.id, req.body.activo);
    await auditService.log({
      idEmpleado: req.user.id, ip: ip(req),
      accion: `CAMBIAR_ESTADO_DISPOSITIVO_BIOMETRICO:${req.params.id}:${req.body.activo}`, modulo: 'BIOMETRIA',
    });
    res.json({ dispositivo });
  }),
};
