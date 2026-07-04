# Backend — Módulo de Contabilidad

API REST en Node.js 20 + Express 4 + Sequelize (MySQL 8) + Redis 7.

## Arquitectura en capas

```
routes → controller → service → repository → model
```

- **routes/**: definición de endpoints y middlewares por recurso.
- **controllers/**: adaptan HTTP ↔ servicios (sin lógica de negocio).
- **services/**: reglas de negocio (partida doble, cierre, auth). Dependencias inyectables (DIP).
- **repositories/**: acceso a datos (aísla Sequelize).
- **models/**: entidades Sequelize y asociaciones.
- **middleware/**: `requireAuth`, `authorizeRoles`, `validateBody`, `errorHandler`.

## Puesta en marcha

```bash
cp .env.template .env      # ajustar credenciales
npm install
npm run db:migrate         # crear tablas
npm run db:seed            # datos demo (roles, sucursal, usuarios)
npm run dev                # http://localhost:4000
```

## Variables de entorno
Ver [.env.template](.env.template).

## Endpoints

### Salud
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado de API + MySQL + Redis |
| GET | `/api` | Metadatos de la API |

### Autenticación (Etapa 1)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Login. Body: `{ usuario, password }` → `{ token, usuario }` |
| GET | `/api/auth/me` | Bearer | Perfil del usuario autenticado |
| POST | `/api/auth/logout` | Bearer | Cierra sesión (revoca el token en Redis) |

**Seguridad:** JWT Bearer, contraseñas con bcrypt (costo ≥ 10), bloqueo tras 5 intentos
fallidos, RBAC por rol (`authorizeRoles`), rate-limit en login, auditoría de acciones en
`log_auditoria`.

### Plan de cuentas (Etapa 2)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/cuentas` | CONTADOR/GERENTE | Lista plana de cuentas |
| GET | `/api/cuentas/arbol` | CONTADOR/GERENTE | Plan de cuentas jerárquico |
| GET | `/api/cuentas/:id` | CONTADOR/GERENTE | Detalle de una cuenta |
| POST | `/api/cuentas` | CONTADOR | Crear cuenta |
| PUT | `/api/cuentas/:id` | CONTADOR | Editar cuenta |
| DELETE | `/api/cuentas/:id` | CONTADOR | Eliminar cuenta (si no tiene subcuentas) |

### Asientos contables (Etapa 3)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/asientos` | CONTADOR/GERENTE | Lista (filtros: `desde`, `hasta`, `estado`, `tipo_origen`) |
| GET | `/api/asientos/:id` | CONTADOR/GERENTE | Detalle con líneas |
| POST | `/api/asientos` | CONTADOR | Crear borrador (valida partida doble) |
| POST | `/api/asientos/:id/confirmar` | CONTADOR | BORRADOR → CONFIRMADO |
| POST | `/api/asientos/:id/anular` | CONTADOR | CONFIRMADO → ANULADO |

Body de creación: `{ fecha, concepto, tipo_origen?, lineas: [{ id_cuenta, debe, haber, descripcion? }] }`.
Regla: Σdebe = Σhaber > 0; las cuentas deben permitir movimiento.

### Generación automática (Etapa 4)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/eventos-contables` | CONTADOR | Genera asiento CONFIRMADO desde evento (VENTA/COMPRA/DEVOLUCION/PAGO) |

Body: `{ tipo, fecha, referencia_id, monto_total, sucursal_id, glosa? }`. IVA 13% "por dentro".

### Libros contables (Etapa 5)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/libros/diario` | CONTADOR/GERENTE | Libro Diario (params: `fecha_inicio`, `fecha_fin`) |
| GET | `/api/libros/mayor` | CONTADOR/GERENTE | Libro Mayor (params: `id_cuenta`, `fecha_inicio`, `fecha_fin`) |

### Estados financieros (Etapa 6)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/reportes/balance-general` | CONTADOR/GERENTE | Balance General (params: `fecha_inicio`, `fecha_fin`) |
| GET | `/api/reportes/estado-resultados` | CONTADOR/GERENTE | Estado de Resultados (params: `fecha_inicio`, `fecha_fin`) |
| GET | `/api/reportes/flujo-caja` | CONTADOR/GERENTE | **Flujo de Caja** (RF-CON-03): saldo inicial + entradas/salidas de Caja/Bancos por origen + saldo final |

### Cierre de gestión (Etapa 7)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/cierres` | CONTADOR/GERENTE | Lista de cierres |
| GET | `/api/cierres/:id` | CONTADOR/GERENTE | Detalle de cierre |
| POST | `/api/cierres` | CONTADOR | Cierra gestión anual (body: `{ anio }`) |

### Dashboard (Etapa 8)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/dashboard` | CONTADOR/GERENTE | KPIs fiscales (params: `gestion`, `mes`) → utilidad, IVA débito/crédito/neto, estado cierre |
| GET | `/api/dashboard/gerencial` | GERENTE | **Dashboard gerencial (RF-REP-01)**: ventas del día, órdenes pendientes, cuentas por pagar, utilidad/IVA del mes y stock bajo / lotes por vencer |

### Libros fiscales (Etapa 8)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/libros-fiscales/compras` | CONTADOR/GERENTE | Libro de Compras (params: `mes`, `gestion`) |
| GET | `/api/libros-fiscales/ventas` | CONTADOR/GERENTE | Libro de Ventas (params: `mes`, `gestion`) |

### Compras y Proveedores (RF-COM)

**Proveedores (RF-COM-01)** — CRUD; baja lógica (`activo=false`).
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/proveedores` | CONTADOR/GERENTE | Lista (param opcional `activo`) |
| GET | `/api/proveedores/:id` | CONTADOR/GERENTE | Detalle |
| POST | `/api/proveedores` | CONTADOR/GERENTE | Crear (NIT único). Body: `{ razon_social, nit, contacto?, telefono?, email?, ciudad? }` |
| PUT | `/api/proveedores/:id` | CONTADOR/GERENTE | Editar |
| DELETE | `/api/proveedores/:id` | CONTADOR/GERENTE | Baja lógica |

**Productos y categorías (RF-INV-01, base de inventario)**
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/productos` | CONTADOR/GERENTE | Lista (params: `activo`, `id_categoria`) |
| GET | `/api/productos/:id` | CONTADOR/GERENTE | Detalle |
| POST | `/api/productos` | CONTADOR/GERENTE | Crear (código de barras único; `precio_venta > precio_compra`) |
| PUT | `/api/productos/:id` | CONTADOR/GERENTE | Editar |
| DELETE | `/api/productos/:id` | CONTADOR/GERENTE | Baja lógica |
| GET | `/api/productos/categorias` | CONTADOR/GERENTE | Lista de categorías |
| POST | `/api/productos/categorias` | CONTADOR/GERENTE | Crear categoría (nombre único) |

**Órdenes de compra y recepción (RF-COM-02/03)** — ciclo BORRADOR → ENVIADA → RECIBIDA (o CANCELADA).
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/ordenes-compra` | CONTADOR/GERENTE | Lista (params: `estado`, `id_proveedor`) |
| GET | `/api/ordenes-compra/:id` | CONTADOR/GERENTE | Detalle con líneas |
| POST | `/api/ordenes-compra` | CONTADOR/GERENTE | Crear borrador. Body: `{ id_proveedor, fecha_emision, condicion_pago?, lineas:[{id_producto, cantidad, precio_unitario}] }` |
| POST | `/api/ordenes-compra/:id/enviar` | CONTADOR/GERENTE | BORRADOR → ENVIADA |
| POST | `/api/ordenes-compra/:id/recibir` | CONTADOR/GERENTE | ENVIADA → RECIBIDA: crea lotes, genera asiento (Inventario+IVA Crédito contra Caja o Cuentas por Pagar) y, si es a crédito, la CxP |
| POST | `/api/ordenes-compra/:id/cancelar` | CONTADOR/GERENTE | BORRADOR/ENVIADA → CANCELADA |

**Cuentas por pagar (RF-COM-04)** — pagos parciales/totales que generan su asiento (Cuentas por Pagar / Caja).
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/cuentas-por-pagar` | CONTADOR/GERENTE | Lista (params: `estado`, `id_proveedor`) |
| GET | `/api/cuentas-por-pagar/:id` | CONTADOR/GERENTE | Detalle con pagos |
| POST | `/api/cuentas-por-pagar/:id/pagos` | CONTADOR/GERENTE | Registrar pago. Body: `{ monto, fecha_pago?, metodo_pago? }` |

### Ventas y POS (RF-VEN)

**Ventas (RF-VEN-01/02)** — registro POS; descuenta stock por FEFO y genera el asiento (Caja/Bancos · Ventas · IVA Débito).
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/ventas` | CONTADOR/GERENTE/CAJERO | Lista (params: `desde`, `hasta`, `id_sucursal`, `id_cajero`, `id_producto`, `estado`, `metodo_pago`) |
| GET | `/api/ventas/reporte` | CONTADOR/GERENTE/CAJERO | **Reporte (RF-VEN-04)**: totales + comparativa por sucursal (mismos filtros) |
| GET | `/api/ventas/:id` | CONTADOR/GERENTE/CAJERO | Detalle con líneas |
| POST | `/api/ventas` | CONTADOR/GERENTE/CAJERO | Registrar venta. Body: `{ id_sucursal?, fecha?, metodo_pago?, descuento?, lineas:[{id_producto, cantidad, precio_unitario?}] }` |
| POST | `/api/ventas/devoluciones` | CONTADOR/GERENTE/CAJERO | **Devolución (RF-VEN-03)**: repone stock + asiento de reversa. Body: `{ id_venta, motivo, lineas:[{id_detalle_venta, cantidad_dev}] }` |

Método de pago → cuenta de cobro: `EFECTIVO`→Caja (1.1.1); `TARJETA_DEBITO`/`TARJETA_CREDITO`/`QR`→Bancos (1.1.2).

### Gestión de usuarios (RF-USR-02/04) — solo GERENTE

Los roles siguen viniendo del **seeder** (no se crean en runtime). El GERENTE crea usuarios y les
asigna un rol; ese rol define a qué módulos accede el usuario.
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/usuarios` | GERENTE | Lista de usuarios con su rol |
| GET | `/api/usuarios/roles` | GERENTE | Roles disponibles (para asignar) |
| GET | `/api/usuarios/:id` | GERENTE | Detalle |
| POST | `/api/usuarios` | GERENTE | Crear. Body: `{ nombre, apellido, usuario, password, id_rol }` |
| PUT | `/api/usuarios/:id` | GERENTE | Editar (nombre, apellido, rol, `password` opcional) |
| POST | `/api/usuarios/:id/estado` | GERENTE | Alta/baja lógica. Body: `{ activo }` |

### Presupuesto (RF-PRE)

Presupuesto **anual por gestión** de Ingresos y Gastos. El CONTADOR define (BORRADOR), el GERENTE
aprueba/rechaza. La ejecución compara lo planificado con lo real (movimientos contables de la gestión).
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/presupuestos` | CONTADOR/GERENTE | Lista (params: `gestion`, `estado`) |
| GET | `/api/presupuestos/:id` | CONTADOR/GERENTE | Detalle con líneas |
| GET | `/api/presupuestos/:id/ejecucion` | CONTADOR/GERENTE | **Ejecución (RF-PRE-03/04/05)**: plan vs real, % y alertas (sobregiro / bajo meta) |
| POST | `/api/presupuestos` | CONTADOR/GERENTE | Crear (RF-PRE-01). Body: `{ nombre, gestion, lineas:[{id_cuenta, monto_planificado}] }` |
| PUT | `/api/presupuestos/:id` | CONTADOR/GERENTE | Editar (solo en BORRADOR) |
| POST | `/api/presupuestos/:id/aprobar` | GERENTE | Aprobar (RF-PRE-02) |
| POST | `/api/presupuestos/:id/rechazar` | GERENTE | Rechazar. Body: `{ observacion? }` |

Solo se presupuestan cuentas hoja de tipo INGRESO o GASTO. No se puede aprobar dos presupuestos
para la misma gestión.

### Auditoría de acciones (RF-REP-03) — solo GERENTE
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/auditoria` | GERENTE | Historial del log inmutable (params: `desde`, `hasta`, `modulo`, `id_empleado`) |
| GET | `/api/auditoria/modulos` | GERENTE | Módulos distintos presentes en el log (para el filtro) |

### Acceso por rol (RBAC por especialidad, RF-USR-02)
- **GERENTE** → todos los módulos + gestión de usuarios.
- **CONTADOR** → Contabilidad y Reportes Financieros (`/cuentas`, `/asientos`, `/libros`, `/reportes`, `/cierres`, `/dashboard`, `/libros-fiscales`, `/eventos-contables`).
- **CAJERO** → Ventas (`/ventas`) + lectura del catálogo (`GET /productos`) para el POS.
- **BODEGUERO** → Inventario y Compras (`/productos`, `/proveedores`, `/ordenes-compra`, `/cuentas-por-pagar`).

### Usuarios demo (seeder)
| Usuario | Contraseña | Rol | Accede a |
|---------|-----------|-----|----------|
| `gerente` | `Gerente123` | GERENTE | Todo + Usuarios |
| `contador` | `Contador123` | CONTADOR | Contabilidad y reportes |
| `cajero` | `Cajero123` | CAJERO | Ventas / POS |
| `bodeguero` | `Bodeguero123` | BODEGUERO | Inventario y compras |

## Pruebas
```bash
npm test        # Jest + Supertest (69 previos + Compras + Ventas + Usuarios)
```
