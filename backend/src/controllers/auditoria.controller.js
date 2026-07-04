import { asyncHandler } from '../utils/asyncHandler.js';
import { auditoriaService } from '../services/auditoria.service.js';

export const auditoriaController = {
  listar: asyncHandler(async (req, res) => {
    const { desde, hasta, modulo, id_empleado } = req.query;
    const logs = await auditoriaService.listar({
      desde,
      hasta,
      modulo,
      id_empleado: id_empleado ? Number(id_empleado) : undefined,
    });
    res.json({ logs });
  }),

  modulos: asyncHandler(async (req, res) => {
    const modulos = await auditoriaService.listarModulos();
    res.json({ modulos });
  }),
};
