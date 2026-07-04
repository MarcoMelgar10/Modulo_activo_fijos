import { asyncHandler } from '../utils/asyncHandler.js';
import { sucursalService } from '../services/sucursal.service.js';

export const sucursalController = {
  listar: asyncHandler(async (req, res) => {
    const sucursales = await sucursalService.listar(req.user);
    res.json({ sucursales });
  }),

  obtener: asyncHandler(async (req, res) => {
    const sucursal = await sucursalService.obtener(req.params.id, req.user);
    res.json({ sucursal });
  }),

  crear: asyncHandler(async (req, res) => {
    const sucursal = await sucursalService.crear(req.body);
    res.status(201).json({ sucursal });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const sucursal = await sucursalService.actualizar(req.params.id, req.body);
    res.json({ sucursal });
  }),

  cambiarEstado: asyncHandler(async (req, res) => {
    const sucursal = await sucursalService.cambiarEstado(req.params.id, req.body.estado);
    res.json({ sucursal });
  }),
};
