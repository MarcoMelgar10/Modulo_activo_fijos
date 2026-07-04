import { asyncHandler } from '../utils/asyncHandler.js';
import { inventarioService } from '../services/inventario.service.js';

export const inventarioController = {
  listarLotes: asyncHandler(async (req, res) => {
    const lotes = await inventarioService.listarLotes(req.query, req.user);
    res.json({ lotes });
  }),

  getStock: asyncHandler(async (req, res) => {
    const stock = await inventarioService.getStockAgregado(req.query, req.user);
    res.json({ stock });
  }),

  getStockProducto: asyncHandler(async (req, res) => {
    const lotes = await inventarioService.getStockProducto(Number(req.params.id_producto));
    res.json({ lotes });
  }),
};
