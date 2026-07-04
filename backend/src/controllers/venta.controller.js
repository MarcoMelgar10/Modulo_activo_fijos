import { asyncHandler } from '../utils/asyncHandler.js';
import { ventaService } from '../services/venta.service.js';
import { devolucionService } from '../services/devolucion.service.js';
import { auditService } from '../services/audit.service.js';

const ip = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

function parseFiltros(query) {
  const { desde, hasta, id_sucursal, id_cajero, id_producto, estado, metodo_pago } = query;
  return {
    desde,
    hasta,
    estado,
    metodo_pago,
    id_sucursal: id_sucursal ? Number(id_sucursal) : undefined,
    id_cajero: id_cajero ? Number(id_cajero) : undefined,
    id_producto: id_producto ? Number(id_producto) : undefined,
  };
}

export const ventaController = {
  listar: asyncHandler(async (req, res) => {
    const ventas = await ventaService.listar(parseFiltros(req.query));
    res.json({ ventas });
  }),

  reporte: asyncHandler(async (req, res) => {
    const reporte = await ventaService.reporte(parseFiltros(req.query));
    res.json(reporte);
  }),

  obtener: asyncHandler(async (req, res) => {
    const venta = await ventaService.obtener(Number(req.params.id));
    res.json({ venta });
  }),

  crear: asyncHandler(async (req, res) => {
    const venta = await ventaService.crear(req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `CREAR_VENTA:${venta.numero_venta}`,
      modulo: 'VENTAS',
    });
    res.status(201).json({ venta });
  }),

  devolver: asyncHandler(async (req, res) => {
    const devolucion = await devolucionService.crear(req.body, req.user.id);
    await auditService.log({
      idEmpleado: req.user.id,
      ip: ip(req),
      accion: `DEVOLUCION_VENTA:${req.body.id_venta}`,
      modulo: 'VENTAS',
    });
    res.status(201).json({ devolucion });
  }),
};
