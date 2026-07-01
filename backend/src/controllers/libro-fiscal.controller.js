import { asyncHandler } from '../utils/asyncHandler.js';
import { libroFiscalService } from '../services/libro-fiscal.service.js';

export const libroFiscalController = {
  obtenerCompras: asyncHandler(async (req, res) => {
    const mes = Number(req.query.mes);
    const gestion = Number(req.query.gestion);
    const data = await libroFiscalService.obtenerLibroCompras({ mes, gestion });
    res.json(data);
  }),

  obtenerVentas: asyncHandler(async (req, res) => {
    const mes = Number(req.query.mes);
    const gestion = Number(req.query.gestion);
    const data = await libroFiscalService.obtenerLibroVentas({ mes, gestion });
    res.json(data);
  }),
};
