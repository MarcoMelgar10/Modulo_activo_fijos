import { sequelize } from '../config/database.js';
import { Rol } from './Rol.js';
import { Sucursal } from './Sucursal.js';
import { Empleado } from './Empleado.js';
import { LogAuditoria } from './LogAuditoria.js';
import { CuentaContable } from './CuentaContable.js';
import { AsientoContable } from './AsientoContable.js';
import { LineaAsiento } from './LineaAsiento.js';
import { CierreContable } from './CierreContable.js';

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
};
