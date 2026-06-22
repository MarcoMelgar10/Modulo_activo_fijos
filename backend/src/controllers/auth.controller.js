import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';

const clientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { token, empleado } = await authService.login(req.body, { ip: clientIp(req) });
    res.json({ token, usuario: empleado });
  }),

  me: asyncHandler(async (req, res) => {
    const empleado = await authService.perfil(req.user.id);
    res.json({ usuario: empleado });
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user.jti, { idEmpleado: req.user.id, ip: clientIp(req) });
    res.json({ message: 'Sesión finalizada' });
  }),
};
