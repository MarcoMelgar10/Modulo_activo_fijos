import { asyncHandler } from '../utils/asyncHandler.js';
import { libroService } from '../services/libro.service.js';
import { logger } from '../config/logger.js';

export const libroController = {
  getLibroDiario: asyncHandler(async (req, res) => {
    const { fecha_inicio, fecha_fin, id_sucursal } = req.query;
    logger.info('Consulta Libro Diario', { fecha_inicio, fecha_fin, id_sucursal, usuario: req.user?.id });

    const resultado = await libroService.obtenerLibroDiario({ fecha_inicio, fecha_fin, id_sucursal });
    res.json(resultado);
  }),

  getLibroMayor: asyncHandler(async (req, res) => {
    const { fecha_inicio, fecha_fin, id_sucursal, id_cuenta } = req.query;
    logger.info('Consulta Libro Mayor', { id_cuenta, fecha_inicio, fecha_fin, id_sucursal, usuario: req.user?.id });

    const resultado = await libroService.obtenerLibroMayor({ id_cuenta, fecha_inicio, fecha_fin, id_sucursal });
    res.json(resultado);
  }),
};
