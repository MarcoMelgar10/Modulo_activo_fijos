import { asyncHandler } from '../utils/asyncHandler.js';
import { dashboardService } from '../services/dashboard.service.js';
import { dashboardGerencialService } from '../services/dashboard-gerencial.service.js';

export const dashboardController = {
  obtenerKPIs: asyncHandler(async (req, res) => {
    const data = await dashboardService.obtenerKPIs(req.query);
    res.json(data);
  }),

  gerencial: asyncHandler(async (req, res) => {
    const data = await dashboardGerencialService.obtener();
    res.json(data);
  }),
};
