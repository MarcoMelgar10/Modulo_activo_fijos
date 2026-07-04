import { sequelize } from '../config/database.js';
import { Rol } from './Rol.js';
import { Sucursal } from './Sucursal.js';
import { Empleado } from './Empleado.js';
import { LogAuditoria } from './LogAuditoria.js';
import { CuentaContable } from './CuentaContable.js';
import { AsientoContable } from './AsientoContable.js';
import { LineaAsiento } from './LineaAsiento.js';
import { CierreContable } from './CierreContable.js';
import { Proveedor } from './Proveedor.js';
import { Categoria } from './Categoria.js';
import { Producto } from './Producto.js';
import { Lote } from './Lote.js';
import { OrdenCompra } from './OrdenCompra.js';
import { DetalleOrdenCompra } from './DetalleOrdenCompra.js';
import { CuentaPorPagar } from './CuentaPorPagar.js';
import { PagoProveedor } from './PagoProveedor.js';
import { Venta } from './Venta.js';
import { DetalleVenta } from './DetalleVenta.js';
import { Devolucion } from './Devolucion.js';
import { DetalleDevolucion } from './DetalleDevolucion.js';
import { Presupuesto } from './Presupuesto.js';
import { LineaPresupuesto } from './LineaPresupuesto.js';
import { Traspaso } from './Traspaso.js';
import { DetalleTraspaso } from './DetalleTraspaso.js';

// ---- Asociaciones ----
Sucursal.hasMany(Empleado, { foreignKey: 'id_sucursal', as: 'empleados' });
Empleado.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });

Rol.hasMany(Empleado, { foreignKey: 'id_rol', as: 'empleados' });
Empleado.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' });

Empleado.hasMany(LogAuditoria, { foreignKey: 'id_empleado', as: 'logs' });
LogAuditoria.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });

// Asientos y sus líneas (partida doble).
AsientoContable.hasMany(LineaAsiento, { foreignKey: 'id_asiento', as: 'lineas', onDelete: 'CASCADE' });
LineaAsiento.belongsTo(AsientoContable, { foreignKey: 'id_asiento', as: 'asiento' });

CuentaContable.hasMany(LineaAsiento, { foreignKey: 'id_cuenta', as: 'lineas' });
LineaAsiento.belongsTo(CuentaContable, { foreignKey: 'id_cuenta', as: 'cuenta' });

Sucursal.hasMany(AsientoContable, { foreignKey: 'id_sucursal', as: 'asientos' });
AsientoContable.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });

// Cierres de gestión (Etapa 7).
CierreContable.belongsTo(AsientoContable, { foreignKey: 'id_asiento_cierre', as: 'asientoCierre' });
CierreContable.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
CierreContable.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });

// ---- Compras, Proveedores e Inventario (RF-COM / RF-INV) ----
// Catálogo.
Categoria.hasMany(Producto, { foreignKey: 'id_categoria', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });

// Lotes de inventario (creados en la recepción).
Producto.hasMany(Lote, { foreignKey: 'id_producto', as: 'lotes' });
Lote.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
Sucursal.hasMany(Lote, { foreignKey: 'id_sucursal', as: 'lotes' });
Lote.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
Proveedor.hasMany(Lote, { foreignKey: 'id_proveedor', as: 'lotes' });
Lote.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });

// Órdenes de compra y su detalle.
Proveedor.hasMany(OrdenCompra, { foreignKey: 'id_proveedor', as: 'ordenes' });
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
Sucursal.hasMany(OrdenCompra, { foreignKey: 'id_sucursal', as: 'ordenes' });
OrdenCompra.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
OrdenCompra.hasMany(DetalleOrdenCompra, { foreignKey: 'id_orden', as: 'detalles', onDelete: 'CASCADE' });
DetalleOrdenCompra.belongsTo(OrdenCompra, { foreignKey: 'id_orden', as: 'orden' });
Producto.hasMany(DetalleOrdenCompra, { foreignKey: 'id_producto', as: 'detallesOrden' });
DetalleOrdenCompra.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
OrdenCompra.belongsTo(AsientoContable, { foreignKey: 'id_asiento_compra', as: 'asientoCompra' });
OrdenCompra.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });

// Cuentas por pagar y pagos (RF-COM-04).
Proveedor.hasMany(CuentaPorPagar, { foreignKey: 'id_proveedor', as: 'cuentasPorPagar' });
CuentaPorPagar.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
OrdenCompra.hasMany(CuentaPorPagar, { foreignKey: 'id_orden', as: 'cuentasPorPagar' });
CuentaPorPagar.belongsTo(OrdenCompra, { foreignKey: 'id_orden', as: 'orden' });
CuentaPorPagar.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
CuentaPorPagar.hasMany(PagoProveedor, { foreignKey: 'id_cxp', as: 'pagos', onDelete: 'CASCADE' });
PagoProveedor.belongsTo(CuentaPorPagar, { foreignKey: 'id_cxp', as: 'cxp' });
PagoProveedor.belongsTo(AsientoContable, { foreignKey: 'id_asiento', as: 'asiento' });
PagoProveedor.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });

// ---- Ventas / POS y Devoluciones (RF-VEN) ----
Venta.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
Venta.belongsTo(Empleado, { foreignKey: 'id_cajero', as: 'cajero' });
Venta.belongsTo(AsientoContable, { foreignKey: 'id_asiento_venta', as: 'asientoVenta' });
Venta.hasMany(DetalleVenta, { foreignKey: 'id_venta', as: 'detalles', onDelete: 'CASCADE' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
DetalleVenta.belongsTo(Lote, { foreignKey: 'id_lote', as: 'lote' });
Producto.hasMany(DetalleVenta, { foreignKey: 'id_producto', as: 'ventas' });

Venta.hasMany(Devolucion, { foreignKey: 'id_venta', as: 'devoluciones' });
Devolucion.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
Devolucion.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });
Devolucion.belongsTo(AsientoContable, { foreignKey: 'id_asiento_devolucion', as: 'asientoDevolucion' });
Devolucion.hasMany(DetalleDevolucion, { foreignKey: 'id_devolucion', as: 'detalles', onDelete: 'CASCADE' });
DetalleDevolucion.belongsTo(Devolucion, { foreignKey: 'id_devolucion', as: 'devolucion' });
DetalleDevolucion.belongsTo(DetalleVenta, { foreignKey: 'id_detalle_venta', as: 'detalleVenta' });

// ---- Presupuesto (RF-PRE) ----
Presupuesto.hasMany(LineaPresupuesto, { foreignKey: 'id_presupuesto', as: 'lineas', onDelete: 'CASCADE' });
LineaPresupuesto.belongsTo(Presupuesto, { foreignKey: 'id_presupuesto', as: 'presupuesto' });
CuentaContable.hasMany(LineaPresupuesto, { foreignKey: 'id_cuenta', as: 'lineasPresupuesto' });
LineaPresupuesto.belongsTo(CuentaContable, { foreignKey: 'id_cuenta', as: 'cuenta' });
Presupuesto.belongsTo(Empleado, { foreignKey: 'id_empleado_creador', as: 'creador' });
Presupuesto.belongsTo(Empleado, { foreignKey: 'id_empleado_aprobador', as: 'aprobador' });

// ---- Traspasos entre sucursales ----
Sucursal.hasMany(Traspaso, { foreignKey: 'id_sucursal_origen', as: 'traspasosOrigen' });
Sucursal.hasMany(Traspaso, { foreignKey: 'id_sucursal_destino', as: 'traspasosDestino' });
Traspaso.belongsTo(Sucursal, { foreignKey: 'id_sucursal_origen', as: 'sucursalOrigen' });
Traspaso.belongsTo(Sucursal, { foreignKey: 'id_sucursal_destino', as: 'sucursalDestino' });
Traspaso.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });
Traspaso.belongsTo(Empleado, { foreignKey: 'id_empleado_recibe', as: 'empleadoRecibe' });
Traspaso.hasMany(DetalleTraspaso, { foreignKey: 'id_traspaso', as: 'detalles', onDelete: 'CASCADE' });
DetalleTraspaso.belongsTo(Traspaso, { foreignKey: 'id_traspaso', as: 'traspaso' });
DetalleTraspaso.belongsTo(Lote, { foreignKey: 'id_lote', as: 'loteOrigen' });
DetalleTraspaso.belongsTo(Lote, { foreignKey: 'id_lote_destino', as: 'loteDestino' });

export {
  sequelize,
  Rol,
  Sucursal,
  Empleado,
  LogAuditoria,
  CuentaContable,
  AsientoContable,
  LineaAsiento,
  CierreContable,
  Proveedor,
  Categoria,
  Producto,
  Lote,
  OrdenCompra,
  DetalleOrdenCompra,
  CuentaPorPagar,
  PagoProveedor,
  Venta,
  DetalleVenta,
  Devolucion,
  DetalleDevolucion,
  Presupuesto,
  LineaPresupuesto,
  Traspaso,
  DetalleTraspaso,
};
