# SPEC CDD — Control multisucursal, transferencia entre sucursales y control biométrico

Proyecto: **Flowy ERP / MarketSuper**  
Repositorio analizado: `Modulo_activo_fijos-main`  
Stack actual: **Node.js 20 + Express 4 + Sequelize + MySQL 8 + Redis 7** en backend; **React 18 + Vite + Tailwind + Axios + React Query + React Router** en frontend.  
Regla crítica del repo: **JavaScript ES2022 ESM, no TypeScript**. Migraciones y seeders en `.cjs`.

---

## 0. Objetivo de esta especificación

Esta especificación está escrita para un agente de codificación. Debe permitir implementar y verificar, sin depender de interpretación adicional, estas capacidades del informe:

1. **Control multisucursal**: administración y uso real de sucursales en usuarios, POS, inventario, compras, reportes, traspasos y biometría.
2. **Transferencia entre sucursales**: movimiento físico de mercancía/lotes entre sucursales, con estados, atomicidad y trazabilidad.
3. **Control biométrico**: registro de eventos de acceso a bodegas enviados por dispositivos biométricos o por simulador académico, sin almacenar huellas ni plantillas biométricas.

La implementación debe ser compatible con el repositorio actual y no debe romper:

- Contabilidad: asientos, libros, reportes, cierres.
- Compras/proveedores: órdenes, recepción y cuentas por pagar.
- Ventas/POS: FEFO, devoluciones, reportes.
- RBAC: `GERENTE`, `CONTADOR`, `CAJERO`, `BODEGUERO`.
- Auditoría: `log_auditoria`.
- Frontend actual: `AppRouter`, `navItems`, design system, React Query.

---

## 1. Fuente funcional del informe

El informe define a MarketSuper como una cadena nacional de 8 sucursales: 4 en Santa Cruz, 2 en La Paz, 1 en Sucre y 1 en Cochabamba. El sistema debe operar como ERP web integrado en tiempo real desde todas ellas.

El informe exige para Bodega/Logística: stock centralizado en tiempo real por sucursal, trazabilidad por lote, planificación de reposiciones y control biométrico para asegurar inventario.

El mini mundo del producto define que Flowy ERP unifica inventario, ventas, compras, contabilidad y control de acceso biométrico, operando en tiempo real desde todas las sucursales.

Actores relevantes del informe:

- `Administrador / Gerente de Sucursal`: gestiona usuarios, permisos, precios, reportes y auditoría.
- `Encargado de Bodega`: gestiona inventario, entradas/salidas por lote, reposiciones y alertas.
- `Cajero`: opera POS.
- `Contador`: genera asientos, informes contables y consolidados.
- `Control de Acceso Biométrico`: actor de hardware externo que envía información al software para autenticar identidades y autorizar acceso físico a bodegas.

Requisitos directamente implementados por esta spec:

- **RF-INV-04 Control biométrico**: registro de eventos del hardware biométrico en bodegas con empleado, fecha, hora y tipo de movimiento `ENTRADA/SALIDA`.
- **RF-INV-05 Traspaso entre sucursales**: registro de traspasos de mercancía entre sucursales con actualización automática del inventario en ambos extremos.
- **RF-USR-05 Control de sucursales / multisucursal**: el sistema debe permitir operar por sucursal y agregar sucursales por configuración, sin modificar código.
- **RNF-05 RBAC**: roles `GERENTE`, `CAJERO`, `BODEGUERO`, `CONTADOR`.
- **RNF-06 Auditoría**: log inmutable de acciones críticas.
- **RNF-10 Escalabilidad**: nueva sucursal por configuración y soporte hasta 24 sucursales.

---

## 2. Contexto real del repositorio actual

### 2.1 Arquitectura backend existente

El backend usa arquitectura estricta:

```txt
routes → controller → service → repository → model
```

Reglas existentes que deben respetarse:

- Controllers solo traducen HTTP ↔ servicio; no deben contener lógica de negocio.
- Services concentran reglas de negocio y se exponen con patrón `createXxxService({ deps })` + instancia default.
- Repositories aíslan Sequelize.
- Models son Sequelize y asociaciones se centralizan en `backend/src/models/index.js`.
- Validators son Zod y se conectan con `validateBody` / `validateQuery`.
- Errores deben lanzarse con `ApiError.badRequest`, `ApiError.forbidden`, `ApiError.conflict`, etc.
- Autenticación usa JWT con `req.user = { id, usuario, rol, id_sucursal, jti }`.
- RBAC usa `authorizeRoles(...)`.

### 2.2 Arquitectura frontend existente

El frontend usa:

```txt
services/*.service.js → queries/use*.js → pages/*.jsx → router/AppRouter.jsx → navItems.js
```

Reglas existentes:

- Usar `api` único de `frontend/src/services/api.js`.
- Usar React Query en `frontend/src/queries`.
- Usar componentes de `frontend/src/components/ui`.
- Proteger rutas con `ProtectedRoute` y `ACCESO`.
- Agregar menú en `frontend/src/components/layout/navItems.js`.
- No crear un segundo sistema de estilos.

### 2.3 Tablas/modelos ya existentes relevantes

Ya existen y deben reutilizarse:

- `sucursal`: existe en migración `20260622000001-auth.cjs` y modelo `Sucursal.js`.
- `empleado`: tiene `id_sucursal`, `id_rol`, `usuario`, `password_hash`, `activo`.
- `rol`: roles existentes: `GERENTE`, `CAJERO`, `BODEGUERO`, `CONTADOR`.
- `lote`: tiene `id_producto`, `id_sucursal`, `id_proveedor`, `numero_lote`, `cantidad_inicial`, `cantidad_actual`, `fecha_vencimiento`, `fecha_ingreso`, `activo`.
- `venta` y `detalle_venta`: ventas descuentan lote por FEFO.
- `orden_compra` y `detalle_orden_compra`: recepción crea lotes.
- `asiento_contable`: tiene `id_sucursal`; reportes ya aceptan filtro `id_sucursal` en varios puntos.
- `log_auditoria`: audita acciones críticas.

### 2.4 Brecha actual frente al informe

El repo ya tiene base técnica para sucursal e inventario por lote, pero hay brechas:

1. Solo se seedéa `Casa Matriz` como sucursal 1.
2. `usuario.service.js` crea usuarios con `id_sucursal = 1` por defecto y el validator actual no permite seleccionar `id_sucursal`.
3. `PuntoVenta.jsx` envía `id_sucursal: 1` hardcodeado.
4. `SimuladorEventos.jsx` tiene selector manual `[1..8]`, no lee sucursales reales.
5. No existen rutas/servicios/repositorios de administración de sucursales.
6. No existe endpoint de inventario por sucursal/lote para traspasos.
7. No existen tablas/modelos/rutas de `traspaso` y `detalle_traspaso`.
8. No existen tablas/modelos/rutas de `acceso_biometrico` ni `dispositivo_biometrico`.
9. `dashboard-gerencial.service.js` calcula stock consolidado, no stock por sucursal.

---

## 3. Principios de implementación CDD

### 3.1 Definición de contrato

En este repo el contrato ejecutable debe implementarse principalmente como:

- Schemas Zod en `backend/src/validators/*.validators.js`.
- Services con reglas deterministas y tests unitarios.
- Endpoints REST documentados y protegidos por RBAC.
- Tests de contrato para flujo feliz y errores.

No es obligatorio introducir OpenAPI si no existe en el repo. Si el agente quiere agregar `docs/api-contracts.md`, es aceptable; no agregar Swagger ni dependencias adicionales.

### 3.2 Orden CDD obligatorio

Para cada recurso nuevo:

1. Escribir/definir contrato de request/response y errores.
2. Crear validator Zod.
3. Crear modelo + migración.
4. Crear repository.
5. Crear service con reglas de negocio.
6. Crear controller.
7. Crear route y registrarla en `routes/index.js`.
8. Crear tests del service y, si es viable, route/validator tests.
9. Crear frontend service.
10. Crear React Query hook.
11. Crear página UI.
12. Registrar ruta y nav.
13. Actualizar docs `PROGRESO.md`, `GUIA_CONTINUIDAD.md`, `backend/README.md`.

### 3.3 Regla de no interferencia

- No editar migraciones existentes ya aplicadas. Agregar migraciones nuevas.
- No cambiar nombres de tablas existentes.
- No cambiar contratos existentes salvo para hacerlos más correctos con sucursal sin romper compatibilidad.
- No introducir TypeScript.
- No introducir otra librería de validación.
- No generar asientos contables por traspaso entre sucursales: es movimiento físico interno, no compra/venta/pago. Mantener la contabilidad intacta.
- No almacenar datos biométricos sensibles: solo registrar eventos.

---

## 4. Roles y reglas multisucursal

### 4.1 Matriz de permisos operativos

| Rol | Sucursales | Ventas/POS | Inventario | Traspasos | Biometría | Reportes financieros |
|---|---|---|---|---|---|---|
| `GERENTE` | CRUD todas | Puede operar/ver todas | Todas | Crear/enviar/recibir/cancelar en todas | Ver todo, simular, gestionar dispositivos | Consolidado y por sucursal |
| `CONTADOR` | Lectura para reportes | No opera POS salvo mantener ruta actual si existe | Solo lectura si se expone en reportes | Sin acceso operativo | Sin acceso operativo | Consolidado y por sucursal |
| `BODEGUERO` | Lee su sucursal | No | Su sucursal | Crear/enviar desde su sucursal; recibir si destino es su sucursal; ver origen/destino propios | Ver/simular accesos de su sucursal | No |
| `CAJERO` | Lee su sucursal | Solo su sucursal | Catálogo global para vender, stock de su sucursal para validación indirecta | No | No | Reporte de ventas propio si la ruta lo permite |

### 4.2 Regla de alcance por sucursal

Implementar helper, preferentemente en `backend/src/utils/sucursalScope.js` o `backend/src/services/sucursal-scope.service.js`:

```js
import { ApiError } from './ApiError.js';

export function isGerente(user) {
  return user?.rol === 'GERENTE';
}

export function isContador(user) {
  return user?.rol === 'CONTADOR';
}

export function requireSucursalOperativa(user, requestedId) {
  if (!user) throw ApiError.unauthorized();
  if (isGerente(user)) return requestedId ? Number(requestedId) : Number(user.id_sucursal);
  const own = Number(user.id_sucursal);
  if (requestedId && Number(requestedId) !== own) {
    throw ApiError.forbidden('No tiene permisos para operar en otra sucursal');
  }
  return own;
}

export function scopeSucursalLectura(user, requestedId, { allowConsolidado = false } = {}) {
  if (!user) throw ApiError.unauthorized();
  if (isGerente(user) || (allowConsolidado && isContador(user))) {
    return requestedId ? Number(requestedId) : undefined;
  }
  return Number(user.id_sucursal);
}
```

Uso esperado:

- POS: `requireSucursalOperativa(req.user, req.body.id_sucursal)`.
- Compras: `requireSucursalOperativa(req.user, req.body.id_sucursal)` para BODEGUERO; GERENTE puede seleccionar.
- Reportes contables: `scopeSucursalLectura(req.user, req.query.id_sucursal, { allowConsolidado: true })`.
- Traspasos: reglas específicas porque un BODEGUERO puede recibir si la sucursal destino es la suya.
- Biometría: BODEGUERO solo lee/simula su sucursal; GERENTE todas.

---

# PARTE A — CONTROL MULTISUCURSAL

## 5. Especificación funcional: sucursales

### 5.1 Alcance

Implementar administración de sucursales como configuración runtime. Esto desbloquea RF-USR-05 y RNF-10: agregar sucursales por configuración, no por cambios de código.

La tabla `sucursal` ya existe y coincide con el informe:

- `id_sucursal`
- `nombre`
- `ciudad`
- `direccion`
- `telefono`
- `estado`: `ACTIVA | INACTIVA | EN_MANTENIMIENTO`
- `created_at`

### 5.2 Endpoints

Base: `/api/sucursales`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/sucursales` | GERENTE, CONTADOR, BODEGUERO, CAJERO | Lista sucursales. No gerentes reciben solo su sucursal salvo CONTADOR en reportes si se decide lectura global. |
| `GET` | `/api/sucursales/:id` | GERENTE, CONTADOR, BODEGUERO, CAJERO | Detalle. No gerente solo puede ver su sucursal. |
| `POST` | `/api/sucursales` | GERENTE | Crea sucursal. |
| `PUT` | `/api/sucursales/:id` | GERENTE | Edita nombre, ciudad, dirección, teléfono, estado. |
| `POST` | `/api/sucursales/:id/estado` | GERENTE | Cambia estado operativo. |

### 5.3 Contratos JSON

#### Crear sucursal

```http
POST /api/sucursales
Authorization: Bearer <token gerente>
Content-Type: application/json
```

```json
{
  "nombre": "Sucursal La Paz Centro",
  "ciudad": "La Paz",
  "direccion": "Av. Mariscal Santa Cruz #100",
  "telefono": "+59122000000",
  "estado": "ACTIVA"
}
```

Respuesta `201`:

```json
{
  "sucursal": {
    "id_sucursal": 2,
    "nombre": "Sucursal La Paz Centro",
    "ciudad": "La Paz",
    "direccion": "Av. Mariscal Santa Cruz #100",
    "telefono": "+59122000000",
    "estado": "ACTIVA"
  }
}
```

#### Cambiar estado

```json
{
  "estado": "INACTIVA"
}
```

Errores:

- `400`: estado inválido.
- `403`: rol no permitido.
- `404`: sucursal no existe.
- `409`: no se puede inactivar porque tiene traspasos `PENDIENTE` o `EN_TRANSITO`, usuarios activos o transacciones operativas abiertas.

### 5.4 Reglas de negocio

- `nombre`, `ciudad`, `direccion` son obligatorios.
- `nombre` debe ser único a nivel operativo. Si no se quiere migrar índice único, validar en service.
- No permitir crear sucursal con `estado = INACTIVA` salvo que el gerente lo indique explícitamente; default `ACTIVA`.
- No permitir usar sucursal `INACTIVA` para ventas, compras, traspasos o dispositivos biométricos.
- `EN_MANTENIMIENTO` permite reportes y consulta histórica, pero bloquea nuevas ventas/compras/traspasos/biometría operativa.

### 5.5 Archivos backend a crear

```txt
backend/src/repositories/sucursal.repository.js
backend/src/services/sucursal.service.js
backend/src/controllers/sucursal.controller.js
backend/src/routes/sucursal.routes.js
backend/src/validators/sucursal.validators.js
backend/tests/sucursal.service.test.js
```

### 5.6 Archivos backend a modificar

```txt
backend/src/routes/index.js
backend/src/models/Sucursal.js              # revisar timestamps/created_at solo si falla create
backend/src/services/usuario.service.js     # validar id_sucursal
backend/src/validators/usuario.validators.js
backend/src/controllers/usuario.controller.js
backend/src/repositories/usuario.repository.js
backend/src/services/venta.service.js       # quitar default real id_sucursal=1 para no-gerente
backend/src/controllers/venta.controller.js
backend/src/services/orden-compra.service.js
backend/src/controllers/orden-compra.controller.js
backend/src/services/dashboard-gerencial.service.js
backend/src/repositories/cuenta-por-pagar.repository.js  # agregar filtro id_sucursal si se usa
```

### 5.7 Archivos frontend a crear

```txt
frontend/src/services/sucursales.service.js
frontend/src/queries/useSucursales.js
frontend/src/pages/Sucursales.jsx
```

### 5.8 Archivos frontend a modificar

```txt
frontend/src/lib/access.js
frontend/src/components/layout/navItems.js
frontend/src/router/AppRouter.jsx
frontend/src/pages/Usuarios.jsx
frontend/src/pages/PuntoVenta.jsx
frontend/src/pages/OrdenesCompra.jsx
frontend/src/pages/ReporteVentas.jsx
frontend/src/pages/SimuladorEventos.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/store/AuthContext.jsx   # solo si /me no devuelve sucursal; preferible no tocar si ya llega
```

### 5.9 Cambios específicos obligatorios

#### Usuario

`crearUsuarioSchema` debe aceptar `id_sucursal`:

```js
id_sucursal: z.number().int().positive('La sucursal es obligatoria')
```

Para `actualizarUsuarioSchema`:

```js
id_sucursal: z.number().int().positive().optional()
```

`usuario.service.crear`:

- No usar default `id_sucursal = 1`.
- Validar que la sucursal existe y está `ACTIVA`.
- Mantener hash bcrypt.

#### POS

`PuntoVenta.jsx` no debe enviar `id_sucursal: 1`. Debe usar:

- `user.id_sucursal` para CAJERO.
- Selector de sucursal solo para GERENTE.

Backend debe imponer la regla aunque frontend se equivoque.

#### Simulador ERP

No usar array `[1,2,3,4,5,6,7,8]`. Usar `useSucursales()`.

#### Dashboard

Mostrar stock bajo y lotes por vencer con `sucursal` en cada fila. GERENTE debe poder ver consolidado y, opcionalmente, filtro por sucursal.

### 5.10 Seeder multisucursal

Crear nuevo seeder idempotente:

```txt
backend/database/seeders/20260704000001-sucursales-marketsuper.cjs
```

Debe insertar o actualizar estas 8 sucursales:

1. Casa Matriz Santa Cruz
2. Santa Cruz Norte
3. Santa Cruz Sur
4. Santa Cruz Equipetrol
5. La Paz Centro
6. La Paz Sur
7. Sucre Central
8. Cochabamba Central

No borrar sucursal 1 existente. Mantener usuarios demo asignados a sucursal 1, y opcionalmente agregar `bodeguero_lp` o `cajero_lp` para pruebas multisucursal.

---

# PARTE B — INVENTARIO CONSULTABLE POR SUCURSAL

## 6. Especificación funcional: vista de stock y lotes

Aunque el usuario pidió traspasos, antes debe existir un endpoint claro para consultar stock transferible por sucursal y lote.

### 6.1 Endpoints

Base: `/api/inventario`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/inventario/lotes` | GERENTE, BODEGUERO, CAJERO lectura indirecta | Lista lotes filtrables por sucursal, producto y activo. |
| `GET` | `/api/inventario/stock` | GERENTE, BODEGUERO, CAJERO lectura indirecta | Stock agregado por producto y sucursal. |
| `GET` | `/api/inventario/productos/:id_producto/stock` | GERENTE, BODEGUERO | Stock de un producto distribuido por sucursal y lotes. |

### 6.2 Query params

```txt
id_sucursal?: number
id_producto?: number
activo?: boolean
solo_disponible?: boolean
proximo_vencer_dias?: number
```

### 6.3 Respuesta stock agregado

```json
{
  "stock": [
    {
      "id_producto": 1,
      "producto": "Leche entera 1L",
      "codigo_barras": "7770001000011",
      "id_sucursal": 1,
      "sucursal": "Casa Matriz Santa Cruz",
      "cantidad_total": 120,
      "stock_minimo": 20,
      "estado_stock": "OK"
    }
  ]
}
```

### 6.4 Reglas

- El stock real se calcula desde `lote.cantidad_actual`.
- No tocar `producto.stock_minimo`; se usa como umbral.
- No descontar stock en endpoints GET.
- CAJERO solo recibe stock de su sucursal si se expone la consulta.
- BODEGUERO solo recibe stock de su sucursal salvo GERENTE.

### 6.5 Archivos nuevos

```txt
backend/src/repositories/inventario.repository.js
backend/src/services/inventario.service.js
backend/src/controllers/inventario.controller.js
backend/src/routes/inventario.routes.js
backend/src/validators/inventario.validators.js
backend/tests/inventario.service.test.js
frontend/src/services/inventario.service.js
frontend/src/queries/useInventario.js
frontend/src/pages/Inventario.jsx        # opcional si Productos se extiende; preferible nueva página
```

### 6.6 Archivos a modificar

```txt
backend/src/routes/index.js
backend/src/repositories/lote.repository.js     # agregar métodos reutilizables, no romper FEFO existente
frontend/src/components/layout/navItems.js
frontend/src/router/AppRouter.jsx
frontend/src/pages/Productos.jsx                # opcional: mostrar botón/ver lotes
```

---

# PARTE C — TRANSFERENCIA ENTRE SUCURSALES

## 7. Especificación funcional: traspasos

Un traspaso es un movimiento físico interno de productos/lotes entre dos sucursales. Debe conservar trazabilidad de origen, destino, empleado autorizador, estado y lotes movidos.

### 7.1 Estados

Estados exactos:

```txt
PENDIENTE → EN_TRANSITO → RECIBIDO
PENDIENTE → CANCELADO
EN_TRANSITO → CANCELADO
```

No permitir:

```txt
RECIBIDO → CANCELADO
CANCELADO → cualquier otro estado
EN_TRANSITO → PENDIENTE
```

### 7.2 Semántica de stock

- `PENDIENTE`: no descuenta stock; solo registra intención.
- `EN_TRANSITO`: descuenta stock del lote origen.
- `RECIBIDO`: crea lote nuevo en sucursal destino con `id_proveedor = null` y suma stock destino mediante ese lote.
- `CANCELADO` desde `PENDIENTE`: no mueve stock.
- `CANCELADO` desde `EN_TRANSITO`: repone stock al lote origen y cancela.

### 7.3 Por qué no se genera asiento contable

El traspaso es movimiento físico interno entre sucursales de la misma empresa. No representa venta, compra, devolución ni pago. En el repositorio actual la contabilidad automática se dispara por ventas, compras, devoluciones y pagos. Para no interferir con libros, balance, IVA y cierre contable, los traspasos no deben crear `asiento_contable`.

### 7.4 Modelo de datos

Crear migración:

```txt
backend/database/migrations/20260704000002-traspasos.cjs
```

#### Tabla `traspaso`

Campos:

```txt
id_traspaso INT PK AI
id_sucursal_origen INT FK sucursal NN
id_sucursal_destino INT FK sucursal NN
id_empleado INT FK empleado NN                   # creador/autorizador del envío, alineado al informe
id_empleado_recibe INT FK empleado NULL           # extensión para trazabilidad de recepción
estado ENUM('PENDIENTE','EN_TRANSITO','RECIBIDO','CANCELADO') NN DEFAULT 'PENDIENTE'
motivo VARCHAR(250) NULL
fecha_creacion TIMESTAMP NN DEFAULT NOW
fecha_envio TIMESTAMP NULL
fecha_recepcion TIMESTAMP NULL
created_at TIMESTAMP NN DEFAULT NOW
```

Restricciones lógicas:

- `id_sucursal_destino != id_sucursal_origen` por service; si se usa CHECK en MySQL 8, mejor.
- Índices: `id_sucursal_origen`, `id_sucursal_destino`, `estado`, `fecha_creacion`.

#### Tabla `detalle_traspaso`

Campos:

```txt
id_detalle INT PK AI
id_traspaso INT FK traspaso NN ON DELETE CASCADE
id_lote INT FK lote NN                         # lote origen; mantiene nombre del informe
id_lote_destino INT FK lote NULL               # lote creado al recibir
cantidad INT NN
```

Restricciones:

- `cantidad > 0` por service.
- Índices: `id_traspaso`, `id_lote`, `id_lote_destino`.

### 7.5 Modelos Sequelize

Crear:

```txt
backend/src/models/Traspaso.js
backend/src/models/DetalleTraspaso.js
```

Registrar en `backend/src/models/index.js`:

```js
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
```

### 7.6 Endpoints

Base: `/api/traspasos`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/traspasos` | GERENTE, BODEGUERO | Lista traspasos. BODEGUERO ve donde origen o destino sea su sucursal. |
| `GET` | `/api/traspasos/:id` | GERENTE, BODEGUERO | Detalle. BODEGUERO solo si participa su sucursal. |
| `POST` | `/api/traspasos` | GERENTE, BODEGUERO | Crea PENDIENTE. |
| `POST` | `/api/traspasos/:id/enviar` | GERENTE, BODEGUERO | PENDIENTE → EN_TRANSITO; descuenta origen. |
| `POST` | `/api/traspasos/:id/recibir` | GERENTE, BODEGUERO | EN_TRANSITO → RECIBIDO; crea lote destino. |
| `POST` | `/api/traspasos/:id/cancelar` | GERENTE, BODEGUERO | Cancela según estado; si estaba EN_TRANSITO repone origen. |

### 7.7 Contrato: crear traspaso

```http
POST /api/traspasos
Authorization: Bearer <token gerente|bodeguero>
Content-Type: application/json
```

```json
{
  "id_sucursal_origen": 1,
  "id_sucursal_destino": 5,
  "motivo": "Reposición por bajo stock",
  "detalles": [
    { "id_lote": 10, "cantidad": 15 },
    { "id_lote": 11, "cantidad": 4 }
  ]
}
```

Respuesta `201`:

```json
{
  "traspaso": {
    "id_traspaso": 1,
    "id_sucursal_origen": 1,
    "id_sucursal_destino": 5,
    "estado": "PENDIENTE",
    "motivo": "Reposición por bajo stock",
    "detalles": [
      { "id_detalle": 1, "id_lote": 10, "cantidad": 15 },
      { "id_detalle": 2, "id_lote": 11, "cantidad": 4 }
    ]
  }
}
```

### 7.8 Contrato: enviar

```http
POST /api/traspasos/1/enviar
Authorization: Bearer <token gerente|bodeguero>
```

Efecto:

- Valida estado `PENDIENTE`.
- Valida stock actual del lote origen dentro de una transacción.
- Descuenta `cantidad_actual` de cada lote origen.
- Si queda `0`, `activo = false`.
- Setea `estado = EN_TRANSITO`, `fecha_envio = now`.

Respuesta `200`:

```json
{
  "traspaso": {
    "id_traspaso": 1,
    "estado": "EN_TRANSITO"
  }
}
```

### 7.9 Contrato: recibir

```http
POST /api/traspasos/1/recibir
Authorization: Bearer <token gerente|bodeguero destino>
Content-Type: application/json
```

```json
{
  "fecha_recepcion": "2026-07-04"
}
```

`fecha_recepcion` es opcional. Si falta, usar fecha actual.

Efecto:

- Valida estado `EN_TRANSITO`.
- Crea un lote destino por cada detalle.
- El lote destino copia `id_producto`, `numero_lote` y `fecha_vencimiento` desde lote origen.
- El lote destino usa:
  - `id_sucursal = id_sucursal_destino`
  - `id_proveedor = null`
  - `cantidad_inicial = detalle.cantidad`
  - `cantidad_actual = detalle.cantidad`
  - `fecha_ingreso = fecha_recepcion`
  - `activo = true`
- Actualiza `detalle_traspaso.id_lote_destino`.
- Setea `estado = RECIBIDO`, `id_empleado_recibe = req.user.id`, `fecha_recepcion = now`.

### 7.10 Contrato: cancelar

```http
POST /api/traspasos/1/cancelar
Authorization: Bearer <token gerente|bodeguero>
Content-Type: application/json
```

```json
{
  "motivo_cancelacion": "Error en cantidades solicitadas"
}
```

`motivo_cancelacion` es opcional. No es necesario persistirlo si no se añade columna; sí debe registrarse en auditoría.

Reglas:

- Si estado `PENDIENTE`: marcar `CANCELADO`.
- Si estado `EN_TRANSITO`: reponer cantidades en lotes origen y marcar `CANCELADO`.
- Si estado `RECIBIDO`: `409 Conflict`, no se cancela.
- Si estado `CANCELADO`: `409 Conflict`.

### 7.11 Validaciones críticas

Crear `traspaso.validators.js`:

```js
const detalleTraspasoSchema = z.object({
  id_lote: z.number().int().positive(),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a cero'),
});

export const crearTraspasoSchema = z.object({
  id_sucursal_origen: z.number().int().positive(),
  id_sucursal_destino: z.number().int().positive(),
  motivo: z.string().trim().max(250).optional(),
  detalles: z.array(detalleTraspasoSchema).min(1, 'El traspaso requiere al menos un lote'),
}).refine((d) => d.id_sucursal_origen !== d.id_sucursal_destino, {
  message: 'La sucursal origen y destino deben ser diferentes',
  path: ['id_sucursal_destino'],
});
```

### 7.12 Reglas de negocio del service

`traspaso.service.js` debe validar:

- Origen y destino existen.
- Origen y destino están `ACTIVA`.
- Origen y destino son diferentes.
- Usuario puede operar origen/destino según rol.
- Cada lote existe.
- Cada lote pertenece a sucursal origen.
- Cada lote está activo y con `cantidad_actual > 0`.
- Cantidad solicitada por detalle `<= cantidad_actual`.
- Si el mismo lote aparece repetido en payload, sumar cantidades antes de validar para evitar doble consumo invisible.
- Todo cambio de stock y estado se ejecuta dentro de transacción Sequelize.

### 7.13 Reglas BODEGUERO

- Puede crear traspaso solo si `id_sucursal_origen === req.user.id_sucursal`.
- Puede enviar solo si origen es su sucursal.
- Puede recibir solo si destino es su sucursal.
- Puede cancelar:
  - `PENDIENTE`: si origen es su sucursal.
  - `EN_TRANSITO`: si origen es su sucursal. Si el negocio quiere cancelar en destino, requerir GERENTE; por defecto no.
- Puede listar/ver si origen o destino es su sucursal.

### 7.14 Archivos backend a crear

```txt
backend/src/models/Traspaso.js
backend/src/models/DetalleTraspaso.js
backend/src/repositories/traspaso.repository.js
backend/src/services/traspaso.service.js
backend/src/controllers/traspaso.controller.js
backend/src/routes/traspaso.routes.js
backend/src/validators/traspaso.validators.js
backend/tests/traspaso.service.test.js
```

### 7.15 Archivos backend a modificar

```txt
backend/src/models/index.js
backend/src/routes/index.js
backend/src/repositories/lote.repository.js
backend/src/services/dashboard-gerencial.service.js
```

Métodos nuevos recomendados para `lote.repository.js`:

```js
findByIdWithProducto(id, t)
findByIdForUpdate(id, t)
actualizarCantidad(id_lote, nuevaCantidad, activo, t)
crearDesdeTraspaso(row, t)
```

No eliminar `findDisponiblesFEFO`, `descontar`, `reponer`, porque ventas y devoluciones dependen de ellos.

### 7.16 Frontend traspasos

Archivos nuevos:

```txt
frontend/src/services/traspasos.service.js
frontend/src/queries/useTraspasos.js
frontend/src/pages/Traspasos.jsx
```

UI requerida:

- Lista de traspasos con filtros: estado, origen, destino, fecha.
- Botón `Nuevo traspaso`.
- Formulario:
  - sucursal origen
  - sucursal destino
  - motivo
  - búsqueda/listado de lotes disponibles en origen
  - cantidad por lote
- Acciones por estado:
  - `PENDIENTE`: Enviar, Cancelar
  - `EN_TRANSITO`: Recibir si destino corresponde; Cancelar si origen corresponde; GERENTE ambas.
  - `RECIBIDO/CANCELADO`: solo lectura.
- Mostrar badges de estado con `Badge` existente.

Invalidaciones React Query:

- Al crear: invalidar `['traspasos']`.
- Al enviar/cancelar/recibir: invalidar `['traspasos']`, `['inventario']`, `['productos']`, `['dashboard']`.

---

# PARTE D — CONTROL BIOMÉTRICO

## 8. Especificación funcional: control biométrico

### 8.1 Alcance

El control biométrico registra eventos de entrada/salida a bodegas. El hardware es actor externo. El software no debe almacenar huellas, rostros, plantillas ni imágenes biométricas.

Se implementa en dos modos:

1. **Modo integración estándar**: endpoint recibido desde dispositivo con `X-Device-Id` y `X-Device-Secret`.
2. **Modo simulador académico**: endpoint autenticado con JWT para demostrar RF-INV-04 sin hardware físico.

Esto elimina la duda del proveedor biométrico: cualquier dispositivo real debe adaptarse a este contrato HTTP.

### 8.2 Modelo de datos

Crear migración:

```txt
backend/database/migrations/20260704000003-biometria.cjs
```

#### Tabla `dispositivo_biometrico`

Tabla técnica necesaria para validar el actor hardware.

```txt
dispositivo_id VARCHAR(50) PK
id_sucursal INT FK sucursal NN
nombre VARCHAR(100) NN
ubicacion VARCHAR(150) NULL
secret_hash VARCHAR(255) NN
activo BOOLEAN NN DEFAULT TRUE
created_at TIMESTAMP NN DEFAULT NOW
```

Índices:

```txt
id_sucursal
activo
```

#### Tabla `acceso_biometrico`

Debe alinearse al diccionario del informe.

```txt
id_acceso BIGINT PK AI
id_empleado INT FK empleado NN
id_sucursal INT FK sucursal NN
fecha_hora TIMESTAMP NN DEFAULT NOW
tipo_movimiento ENUM('ENTRADA','SALIDA') NN
resultado BOOLEAN NN
dispositivo_id VARCHAR(50) FK dispositivo_biometrico NN
created_at TIMESTAMP NN DEFAULT NOW
```

Índices:

```txt
id_empleado
id_sucursal
dispositivo_id
fecha_hora
(id_sucursal, fecha_hora)
(resultado, fecha_hora)
```

### 8.3 Modelos Sequelize

Crear:

```txt
backend/src/models/DispositivoBiometrico.js
backend/src/models/AccesoBiometrico.js
```

Registrar en `models/index.js`:

```js
Sucursal.hasMany(DispositivoBiometrico, { foreignKey: 'id_sucursal', as: 'dispositivosBiometricos' });
DispositivoBiometrico.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });

Sucursal.hasMany(AccesoBiometrico, { foreignKey: 'id_sucursal', as: 'accesosBiometricos' });
AccesoBiometrico.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'sucursal' });
Empleado.hasMany(AccesoBiometrico, { foreignKey: 'id_empleado', as: 'accesosBiometricos' });
AccesoBiometrico.belongsTo(Empleado, { foreignKey: 'id_empleado', as: 'empleado' });
DispositivoBiometrico.hasMany(AccesoBiometrico, { foreignKey: 'dispositivo_id', as: 'eventos' });
AccesoBiometrico.belongsTo(DispositivoBiometrico, { foreignKey: 'dispositivo_id', as: 'dispositivo' });
```

### 8.4 Endpoints dispositivos

Base: `/api/dispositivos-biometricos`

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/dispositivos-biometricos` | GERENTE, BODEGUERO | Lista dispositivos. BODEGUERO solo su sucursal. |
| `GET` | `/api/dispositivos-biometricos/:id` | GERENTE, BODEGUERO | Detalle. |
| `POST` | `/api/dispositivos-biometricos` | GERENTE | Crea dispositivo con secreto. |
| `PUT` | `/api/dispositivos-biometricos/:id` | GERENTE | Edita nombre, ubicación, sucursal o rota secreto. |
| `POST` | `/api/dispositivos-biometricos/:id/estado` | GERENTE | Activa/desactiva. |

#### Crear dispositivo

```json
{
  "dispositivo_id": "BIO-SC-001",
  "id_sucursal": 1,
  "nombre": "Bodega Casa Matriz - Puerta 1",
  "ubicacion": "Ingreso principal de bodega",
  "secret": "DeviceSecret123"
}
```

Reglas:

- `secret` se guarda solo como `secret_hash` bcrypt.
- Nunca responder `secret_hash`.
- `id_sucursal` debe existir y estar activa.

### 8.5 Endpoints accesos biométricos

Base: `/api/accesos-biometricos`

| Método | Ruta | Auth | Roles | Descripción |
|---|---|---|---|---|
| `GET` | `/api/accesos-biometricos` | JWT | GERENTE, BODEGUERO | Lista eventos con filtros. |
| `GET` | `/api/accesos-biometricos/:id` | JWT | GERENTE, BODEGUERO | Detalle. |
| `POST` | `/api/accesos-biometricos/eventos` | Device headers | Dispositivo | Registra evento real de hardware. |
| `POST` | `/api/accesos-biometricos/simular` | JWT | GERENTE, BODEGUERO | Simula evento para demo. |

### 8.6 Contrato: evento real de dispositivo

```http
POST /api/accesos-biometricos/eventos
X-Device-Id: BIO-SC-001
X-Device-Secret: DeviceSecret123
Content-Type: application/json
```

```json
{
  "id_empleado": 4,
  "tipo_movimiento": "ENTRADA",
  "fecha_hora": "2026-07-04T08:30:00.000Z"
}
```

Respuesta si autorizado:

```json
{
  "acceso": {
    "id_acceso": 100,
    "id_empleado": 4,
    "id_sucursal": 1,
    "tipo_movimiento": "ENTRADA",
    "resultado": true,
    "dispositivo_id": "BIO-SC-001",
    "fecha_hora": "2026-07-04T08:30:00.000Z"
  },
  "autorizado": true,
  "mensaje": "ACCESO_AUTORIZADO"
}
```

Respuesta si denegado por regla de negocio, pero dispositivo válido:

```json
{
  "acceso": {
    "id_acceso": 101,
    "id_empleado": 3,
    "id_sucursal": 1,
    "tipo_movimiento": "ENTRADA",
    "resultado": false,
    "dispositivo_id": "BIO-SC-001"
  },
  "autorizado": false,
  "mensaje": "ACCESO_DENEGADO"
}
```

Si el dispositivo no se autentica:

- `401`: headers ausentes o secreto inválido.
- No registrar acceso porque no se confía en el hardware.

### 8.7 Contrato: simulador

```http
POST /api/accesos-biometricos/simular
Authorization: Bearer <token gerente|bodeguero>
Content-Type: application/json
```

```json
{
  "dispositivo_id": "BIO-SC-001",
  "id_empleado": 4,
  "tipo_movimiento": "SALIDA",
  "fecha_hora": "2026-07-04T18:00:00.000Z"
}
```

El simulador usa las mismas reglas de autorización que el endpoint de hardware.

### 8.8 Reglas de autorización biométrica

Un evento se autoriza (`resultado = true`) solo si:

1. El dispositivo existe.
2. El dispositivo está activo.
3. La sucursal del dispositivo está `ACTIVA`.
4. El empleado existe.
5. El empleado está activo.
6. El empleado pertenece a la misma sucursal del dispositivo **o** tiene rol `GERENTE`.
7. El empleado tiene rol `BODEGUERO` o `GERENTE`.
8. `tipo_movimiento` es `ENTRADA` o `SALIDA`.

Si falla 4–8, registrar evento con `resultado = false`. Si falla 1–3 en endpoint real, rechazar con `401/403/409` según el caso y no registrar.

### 8.9 Filtros de consulta

`GET /api/accesos-biometricos` acepta:

```txt
id_sucursal?: number
id_empleado?: number
dispositivo_id?: string
tipo_movimiento?: ENTRADA|SALIDA
resultado?: boolean
desde?: YYYY-MM-DD
hasta?: YYYY-MM-DD
```

BODEGUERO solo ve eventos de su sucursal.

### 8.10 Archivos backend a crear

```txt
backend/src/models/DispositivoBiometrico.js
backend/src/models/AccesoBiometrico.js
backend/src/repositories/dispositivo-biometrico.repository.js
backend/src/repositories/acceso-biometrico.repository.js
backend/src/services/dispositivo-biometrico.service.js
backend/src/services/acceso-biometrico.service.js
backend/src/controllers/dispositivo-biometrico.controller.js
backend/src/controllers/acceso-biometrico.controller.js
backend/src/routes/dispositivo-biometrico.routes.js
backend/src/routes/acceso-biometrico.routes.js
backend/src/validators/dispositivo-biometrico.validators.js
backend/src/validators/acceso-biometrico.validators.js
backend/tests/dispositivo-biometrico.service.test.js
backend/tests/acceso-biometrico.service.test.js
```

### 8.11 Archivos backend a modificar

```txt
backend/src/models/index.js
backend/src/routes/index.js
backend/src/services/dashboard-gerencial.service.js
```

### 8.12 Frontend biometría

Archivos nuevos:

```txt
frontend/src/services/dispositivos-biometricos.service.js
frontend/src/services/accesos-biometricos.service.js
frontend/src/queries/useDispositivosBiometricos.js
frontend/src/queries/useAccesosBiometricos.js
frontend/src/pages/DispositivosBiometricos.jsx
frontend/src/pages/AccesosBiometricos.jsx
```

UI requerida:

- Página `Accesos biométricos`:
  - filtros por sucursal, empleado, dispositivo, resultado, fecha.
  - tabla con fecha/hora, empleado, sucursal, dispositivo, movimiento, resultado.
  - badge `AUTORIZADO` o `DENEGADO`.
  - botón `Simular acceso` para GERENTE/BODEGUERO.
- Página `Dispositivos biométricos`:
  - solo GERENTE crea/edita/activa/desactiva.
  - BODEGUERO puede ver dispositivos de su sucursal si se permite lectura.

### 8.13 Navegación

Agregar en `ACCESO`:

```js
BIOMETRIA: ['GERENTE', 'BODEGUERO'],
SUCURSALES: ['GERENTE'],
TRASPASOS: ['GERENTE', 'BODEGUERO'],
```

Agregar a `navItems`:

```js
{ to: '/inventario', label: 'Inventario por sucursal', section: 'Inventario', roles: ACCESO.INVENTARIO },
{ to: '/traspasos', label: 'Traspasos', section: 'Inventario', roles: ACCESO.TRASPASOS },
{ to: '/accesos-biometricos', label: 'Accesos biométricos', section: 'Inventario', roles: ACCESO.BIOMETRIA },
{ to: '/dispositivos-biometricos', label: 'Dispositivos biométricos', section: 'Administración', roles: ACCESO.SUCURSALES },
{ to: '/sucursales', label: 'Sucursales', section: 'Administración', roles: ACCESO.SUCURSALES },
```

---

# PARTE E — INTEGRACIÓN CON MÓDULOS EXISTENTES

## 9. Impacto sobre ventas/POS

### 9.1 Backend

`venta.controller.crear` debe resolver sucursal operativa:

```js
const idSucursal = requireSucursalOperativa(req.user, req.body.id_sucursal);
const venta = await ventaService.crear({ ...req.body, id_sucursal: idSucursal }, req.user.id);
```

`venta.controller.listar/reporte` debe limitar sucursal para CAJERO:

```js
const idSucursal = scopeSucursalLectura(req.user, req.query.id_sucursal, { allowConsolidado: false });
```

### 9.2 Frontend

`PuntoVenta.jsx`:

- Importar `useAuth`.
- Para CAJERO, mostrar texto `Sucursal: <nombre>` y no permitir selector.
- Para GERENTE, mostrar selector `useSucursales()`.
- Payload no debe hardcodear `1`.

## 10. Impacto sobre compras

`orden-compra.service.crear` actualmente default `id_sucursal = 1`. Cambiar:

- Recibir `id_sucursal` ya resuelto por controller.
- Si falta, error `400`, no default silencioso.
- BODEGUERO solo crea en su sucursal.
- GERENTE puede elegir.

`ordenCompraRepository.findAll` debe aceptar `id_sucursal` para filtrar.

## 11. Impacto sobre usuarios

`Usuarios.jsx` debe incluir selector de sucursal obligatorio al crear/editar.

`usuarioRepository.findAll` ya incluye sucursal; asegurar que `findById` también.

## 12. Impacto sobre reportes contables

Reportes ya tienen `id_sucursal` en varias queries. Mantener y usar:

- GERENTE/CONTADOR: pueden consultar consolidado si no envían `id_sucursal`.
- Si envían `id_sucursal`, filtra por sucursal.

No cambiar cálculo de balance/estado si no es necesario.

## 13. Impacto sobre dashboard gerencial

Agregar al dashboard:

```json
{
  "traspasos": {
    "pendientes": 3,
    "en_transito": 2
  },
  "biometria": {
    "denegados_hoy": 1,
    "ultimos_eventos": []
  },
  "stock": {
    "bajo": [
      { "id_sucursal": 1, "sucursal": "Casa Matriz", "producto": "Leche", "stock_actual": 2 }
    ],
    "por_vencer": []
  }
}
```

No eliminar campos existentes.

## 14. Auditoría obligatoria

Registrar en `log_auditoria`:

```txt
CREAR_SUCURSAL:<id|nombre>
EDITAR_SUCURSAL:<id>
CAMBIAR_ESTADO_SUCURSAL:<id>:<estado>
CREAR_TRASPASO:<id>
ENVIAR_TRASPASO:<id>
RECIBIR_TRASPASO:<id>
CANCELAR_TRASPASO:<id>
CREAR_DISPOSITIVO_BIOMETRICO:<dispositivo_id>
EDITAR_DISPOSITIVO_BIOMETRICO:<dispositivo_id>
CAMBIAR_ESTADO_DISPOSITIVO_BIOMETRICO:<dispositivo_id>:<activo>
SIMULAR_ACCESO_BIOMETRICO:<id_acceso>
```

Módulos:

```txt
SUCURSALES
INVENTARIO
TRASPASOS
BIOMETRIA
```

El endpoint real de dispositivo no necesita `log_auditoria` porque `acceso_biometrico` es el registro de auditoría del acceso físico.

---

# PARTE F — TESTS Y CRITERIOS DE ACEPTACIÓN

## 15. Tests obligatorios por módulo

### 15.1 Sucursales

`backend/tests/sucursal.service.test.js`

Casos:

- Crea sucursal válida.
- Rechaza nombre duplicado.
- Rechaza estado inválido vía validator.
- Rechaza inactivar sucursal con traspasos en tránsito.
- BODEGUERO no puede ver otra sucursal si se prueba scope.

### 15.2 Inventario

`backend/tests/inventario.service.test.js`

Casos:

- Calcula stock por producto/sucursal desde lotes activos.
- Excluye lotes inactivos o cantidad 0 si `solo_disponible`.
- BODEGUERO solo recibe su sucursal.
- GERENTE puede consolidar.

### 15.3 Traspasos

`backend/tests/traspaso.service.test.js`

Casos mínimos:

1. Crear traspaso PENDIENTE no descuenta stock.
2. Enviar PENDIENTE descuenta lote origen.
3. Recibir EN_TRANSITO crea lote destino con proveedor null.
4. Cancelar PENDIENTE no toca stock.
5. Cancelar EN_TRANSITO repone stock origen.
6. Rechaza origen igual a destino.
7. Rechaza lote que no pertenece a origen.
8. Rechaza stock insuficiente.
9. Rechaza recibir traspaso no EN_TRANSITO.
10. Rechaza cancelar RECIBIDO.
11. BODEGUERO no puede crear desde otra sucursal.
12. BODEGUERO destino puede recibir.

### 15.4 Biometría

`backend/tests/acceso-biometrico.service.test.js`

Casos:

1. Autoriza BODEGUERO activo en misma sucursal del dispositivo.
2. Autoriza GERENTE aunque su sucursal difiera.
3. Deniega CAJERO.
4. Deniega empleado inactivo.
5. Deniega empleado de otra sucursal.
6. Rechaza dispositivo inactivo.
7. Rechaza secreto inválido en endpoint real.
8. Registra evento denegado cuando el empleado no cumple reglas pero el dispositivo es válido.
9. BODEGUERO solo lista eventos de su sucursal.

### 15.5 Frontend

Agregar tests si el patrón actual lo permite:

- `Traspasos.jsx`: render básico, formulario requiere origen/destino/detalle.
- `AccesosBiometricos.jsx`: render básico con tabla y filtros.
- `Sucursales.jsx`: render básico para GERENTE.

Si no se agregan por tiempo, al menos `npm run build` debe pasar.

## 16. Criterios de aceptación funcional

### Control multisucursal

- Existen 8 sucursales demo.
- GERENTE puede crear/editar/activar/inactivar sucursales.
- Usuarios pueden asignarse a una sucursal real.
- CAJERO no puede registrar venta en sucursal ajena aunque manipule payload.
- BODEGUERO no puede crear orden/traspaso desde sucursal ajena.
- Reportes pueden filtrarse por sucursal.
- POS ya no hardcodea `id_sucursal: 1`.

### Traspasos

- Traspaso PENDIENTE visible sin mover stock.
- Enviar descuenta origen.
- Recibir crea lote destino.
- Stock total corporativo se conserva antes/después de un traspaso recibido.
- Stock por sucursal cambia correctamente.
- Operación es atómica: si una línea falla, ninguna se descuenta.

### Biometría

- Endpoint real autentica dispositivo por headers.
- Simulador permite demo sin hardware.
- No se guarda huella/template/imagen.
- Eventos autorizados y denegados quedan registrados.
- BODEGUERO solo ve su sucursal.
- GERENTE ve todo.

## 17. Comandos de verificación

Después de implementar:

```bash
cd backend
npm run lint
npm test
npm run db:migrate
npm run db:seed
```

```bash
cd frontend
npm run lint
npm test
npm run build
```

Con Docker:

```bash
docker compose up --build
curl http://localhost:4000/health
```

---

# PARTE G — PLAN DE IMPLEMENTACIÓN RECOMENDADO

## 18. Orden por commits o PRs

### PR 1 — Sucursales y scope multisucursal

- Crear `sucursal` backend API.
- Crear `useSucursales` y página `Sucursales`.
- Agregar seeder 8 sucursales.
- Modificar usuarios para asignar sucursal.
- Quitar hardcodes `id_sucursal = 1` del frontend.
- Agregar helper de scope.

### PR 2 — Inventario por sucursal

- Crear endpoints `/api/inventario/lotes` y `/api/inventario/stock`.
- Crear página `Inventario` o extender `Productos`.
- Integrar filtros por sucursal.

### PR 3 — Traspasos

- Crear migración/modelos/repositorios/services/controllers/routes/validators.
- Registrar rutas.
- Crear frontend `Traspasos`.
- Agregar dashboard KPIs de traspasos.
- Tests completos.

### PR 4 — Biometría

- Crear migración/modelos/repositorios/services/controllers/routes/validators.
- Crear dispositivos y accesos.
- Crear simulador.
- Crear frontend `AccesosBiometricos` y `DispositivosBiometricos`.
- Agregar dashboard biometría.
- Tests completos.

### PR 5 — Documentación y endurecimiento

- Actualizar README backend con endpoints.
- Actualizar `PROGRESO.md` y `GUIA_CONTINUIDAD.md`.
- Revisar permisos por rol.
- Revisar índices.
- Ejecutar lint/test/build.

---

# PARTE H — ARCHIVOS NUEVOS TOTALES

## 19. Backend nuevos

```txt
backend/database/migrations/20260704000002-traspasos.cjs
backend/database/migrations/20260704000003-biometria.cjs
backend/database/seeders/20260704000001-sucursales-marketsuper.cjs
backend/database/seeders/20260704000002-biometria-demo.cjs
backend/src/utils/sucursalScope.js
backend/src/models/Traspaso.js
backend/src/models/DetalleTraspaso.js
backend/src/models/DispositivoBiometrico.js
backend/src/models/AccesoBiometrico.js
backend/src/repositories/sucursal.repository.js
backend/src/repositories/inventario.repository.js
backend/src/repositories/traspaso.repository.js
backend/src/repositories/dispositivo-biometrico.repository.js
backend/src/repositories/acceso-biometrico.repository.js
backend/src/services/sucursal.service.js
backend/src/services/inventario.service.js
backend/src/services/traspaso.service.js
backend/src/services/dispositivo-biometrico.service.js
backend/src/services/acceso-biometrico.service.js
backend/src/controllers/sucursal.controller.js
backend/src/controllers/inventario.controller.js
backend/src/controllers/traspaso.controller.js
backend/src/controllers/dispositivo-biometrico.controller.js
backend/src/controllers/acceso-biometrico.controller.js
backend/src/routes/sucursal.routes.js
backend/src/routes/inventario.routes.js
backend/src/routes/traspaso.routes.js
backend/src/routes/dispositivo-biometrico.routes.js
backend/src/routes/acceso-biometrico.routes.js
backend/src/validators/sucursal.validators.js
backend/src/validators/inventario.validators.js
backend/src/validators/traspaso.validators.js
backend/src/validators/dispositivo-biometrico.validators.js
backend/src/validators/acceso-biometrico.validators.js
backend/tests/sucursal.service.test.js
backend/tests/inventario.service.test.js
backend/tests/traspaso.service.test.js
backend/tests/dispositivo-biometrico.service.test.js
backend/tests/acceso-biometrico.service.test.js
```

## 20. Frontend nuevos

```txt
frontend/src/services/sucursales.service.js
frontend/src/services/inventario.service.js
frontend/src/services/traspasos.service.js
frontend/src/services/dispositivos-biometricos.service.js
frontend/src/services/accesos-biometricos.service.js
frontend/src/queries/useSucursales.js
frontend/src/queries/useInventario.js
frontend/src/queries/useTraspasos.js
frontend/src/queries/useDispositivosBiometricos.js
frontend/src/queries/useAccesosBiometricos.js
frontend/src/pages/Sucursales.jsx
frontend/src/pages/Inventario.jsx
frontend/src/pages/Traspasos.jsx
frontend/src/pages/DispositivosBiometricos.jsx
frontend/src/pages/AccesosBiometricos.jsx
```

---

# PARTE I — ARCHIVOS EXISTENTES A MODIFICAR

## 21. Backend existentes

```txt
backend/src/models/index.js
backend/src/routes/index.js
backend/src/repositories/lote.repository.js
backend/src/repositories/orden-compra.repository.js
backend/src/repositories/venta.repository.js
backend/src/repositories/usuario.repository.js
backend/src/repositories/cuenta-por-pagar.repository.js
backend/src/services/usuario.service.js
backend/src/services/venta.service.js
backend/src/services/orden-compra.service.js
backend/src/services/dashboard-gerencial.service.js
backend/src/controllers/usuario.controller.js
backend/src/controllers/venta.controller.js
backend/src/controllers/orden-compra.controller.js
backend/src/validators/usuario.validators.js
backend/src/validators/venta.validators.js
backend/src/validators/orden-compra.validators.js
backend/README.md
PROGRESO.md
GUIA_CONTINUIDAD.md
```

## 22. Frontend existentes

```txt
frontend/src/lib/access.js
frontend/src/components/layout/navItems.js
frontend/src/router/AppRouter.jsx
frontend/src/pages/Usuarios.jsx
frontend/src/pages/PuntoVenta.jsx
frontend/src/pages/OrdenesCompra.jsx
frontend/src/pages/ReporteVentas.jsx
frontend/src/pages/SimuladorEventos.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/queries/useVentas.js
frontend/src/queries/useOrdenesCompra.js
frontend/src/queries/useUsuarios.js
```

---

# PARTE J — CONTRATOS DE RESPUESTA Y ERRORES

## 23. Formato de respuesta

Mantener estilo actual del repo:

```json
{ "sucursal": {} }
{ "sucursales": [] }
{ "traspaso": {} }
{ "traspasos": [] }
{ "acceso": {} }
{ "accesos": [] }
{ "dispositivo": {} }
{ "dispositivos": [] }
```

No introducir wrapper global `{ data, meta, error }` porque el repo no lo usa.

## 24. Errores esperados

Usar `ApiError`.

| Caso | HTTP | Mensaje sugerido |
|---|---:|---|
| Token faltante | 401 | `Token no provisto` |
| Rol insuficiente | 403 | `No tiene permisos para esta acción` |
| Sucursal ajena | 403 | `No tiene permisos para operar en otra sucursal` |
| Sucursal inexistente | 400/404 | `La sucursal indicada no existe` |
| Sucursal inactiva | 409 | `La sucursal no está activa` |
| Origen = destino | 400 | `La sucursal origen y destino deben ser diferentes` |
| Lote ajeno a origen | 400 | `El lote no pertenece a la sucursal origen` |
| Stock insuficiente | 409 | `Stock insuficiente para el lote <id>` |
| Estado inválido traspaso | 409 | `No se puede <acción> un traspaso <estado>` |
| Dispositivo inválido | 401 | `Dispositivo no autenticado` |
| Dispositivo inactivo | 403 | `Dispositivo biométrico inactivo` |

---

# PARTE K — PUNTOS DE RIESGO Y MITIGACIÓN

## 25. Riesgos técnicos

1. **Hardcodes de sucursal 1**: revisar con `rg "id_sucursal: 1|sucursalId\('1'|Sucursal \{num\}|\[1, 2, 3"`.
2. **Concurrencia en stock**: traspasos deben usar transacción y revalidación de stock en el momento de enviar.
3. **No romper FEFO**: no eliminar métodos actuales de `lote.repository.js`.
4. **No romper reportes contables**: traspasos no generan asientos.
5. **Biometría sin proveedor real**: contrato estándar + simulador resuelven la entrega académica; un SDK real se adapta después.
6. **Device secrets**: nunca guardar secreto plano; usar bcrypt.
7. **RBAC duplicado frontend/backend**: backend es autoridad; frontend solo UX.

## 26. Criterio de compatibilidad final

La implementación es compatible si:

- Todos los tests previos siguen pasando.
- Ninguna ruta existente cambia su path.
- Las rutas existentes que aceptaban `id_sucursal` siguen aceptándolo.
- Usuarios existentes siguen pudiendo login.
- Datos demo previos siguen sirviendo.
- Nuevo seeder no borra datos anteriores.
- Dashboard conserva campos existentes y solo agrega nuevos.

---

# PARTE L — PROMPT DIRECTO PARA EL AGENTE DE CODIFICACIÓN

Implementa en el repositorio `Modulo_activo_fijos-main` las capacidades de control multisucursal, traspasos entre sucursales y control biométrico siguiendo exactamente esta spec CDD. Respeta la arquitectura existente `routes → controller → service → repository → model`, JavaScript ESM, Sequelize, Zod, ApiError, RBAC y React Query. No uses TypeScript. No edites migraciones ya existentes; crea migraciones nuevas. No introduzcas dependencias salvo necesidad extrema. Escribe tests de service para cada módulo nuevo. No generes asientos contables por traspasos. No almacenes datos biométricos sensibles; solo eventos. Quita hardcodes de `id_sucursal = 1` en flujos operativos y usa el usuario autenticado o selector de GERENTE. Al finalizar ejecuta lint/test/build y actualiza README/PROGRESO/GUIA_CONTINUIDAD.

---

# ANEXO — Inventario completo de archivos analizados y acción esperada

| Archivo | Rol / acción según spec |
|---|---|
| `.editorconfig` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `.github/workflows/ci.yml` | CI/CD GitHub Actions; debe seguir pasando lint/test/build. |
| `.gitignore` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `AGENTS.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `DEPLOY.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `GUIA_CONTINUIDAD.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `PROGRESO.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `README.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `backend/.dockerignore` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/.env.template` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/.prettierrc.json` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/.sequelizerc` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/Dockerfile` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/README.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `backend/database/config.cjs` | Archivo existente; mantener salvo impacto explícito de la spec. |
| `backend/database/migrations/20260622000001-auth.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260622000002-cuenta-contable.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260622000003-asientos.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260627000001-add-pago-tipo-origen.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260628000001-cierre-contable.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260702000001-proveedores.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260702000002-inventario.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260702000003-ordenes-compra.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260702000004-cuentas-por-pagar.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260703000001-ventas.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/migrations/20260703000003-presupuesto.cjs` | Migración Sequelize existente; no editar si ya aplicada. Agregar migraciones nuevas incrementales. |
| `backend/database/seeders/20260622000001-auth-demo.cjs` | Seeder demo existente; puede ampliarse con sucursales/dispositivos/lotes demo mediante nuevo seeder idempotente. |
| `backend/database/seeders/20260622000002-plan-cuentas.cjs` | Seeder demo existente; puede ampliarse con sucursales/dispositivos/lotes demo mediante nuevo seeder idempotente. |
| `backend/database/seeders/20260627000001-eventos-demo.cjs` | Seeder demo existente; puede ampliarse con sucursales/dispositivos/lotes demo mediante nuevo seeder idempotente. |
| `backend/database/seeders/20260702000001-proveedores-demo.cjs` | Seeder demo existente; puede ampliarse con sucursales/dispositivos/lotes demo mediante nuevo seeder idempotente. |
| `backend/database/seeders/20260702000002-inventario-demo.cjs` | Seeder demo existente; puede ampliarse con sucursales/dispositivos/lotes demo mediante nuevo seeder idempotente. |
| `backend/database/seeders/20260703000002-usuarios-demo.cjs` | Seeder demo existente; puede ampliarse con sucursales/dispositivos/lotes demo mediante nuevo seeder idempotente. |
| `backend/eslint.config.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/jest.config.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `backend/package-lock.json` | Lockfile npm generado; no editar manualmente; actualizar solo con npm install si cambian dependencias. |
| `backend/package.json` | Scripts y dependencias; modificar solo si se añaden librerías, lo cual no es necesario para esta spec. |
| `backend/src/app.js` | Factory/config de Express; no tocar salvo que se añadan middlewares globales. |
| `backend/src/config/database.js` | Configuración backend; sin cambios salvo env opcional para biometría si se usa secreto global. |
| `backend/src/config/env.js` | Configuración backend; sin cambios salvo env opcional para biometría si se usa secreto global. |
| `backend/src/config/logger.js` | Configuración backend; sin cambios salvo env opcional para biometría si se usa secreto global. |
| `backend/src/config/redis.js` | Configuración backend; sin cambios salvo env opcional para biometría si se usa secreto global. |
| `backend/src/controllers/asiento.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/auditoria.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/auth.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/cierre.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/cuenta-por-pagar.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/cuenta.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/dashboard.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/evento.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/health.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/libro-fiscal.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/libro.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/orden-compra.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/presupuesto.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/producto.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/proveedor.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/reporte.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/usuario.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/controllers/venta.controller.js` | Adaptador HTTP; sin lógica de negocio. Agregar controllers nuevos y auditoría. |
| `backend/src/middleware/authorizeRoles.js` | Middleware transversal; reutilizar requireAuth, authorizeRoles y validate; añadir helper multisucursal si se implementa. |
| `backend/src/middleware/errorHandler.js` | Middleware transversal; reutilizar requireAuth, authorizeRoles y validate; añadir helper multisucursal si se implementa. |
| `backend/src/middleware/notFound.js` | Middleware transversal; reutilizar requireAuth, authorizeRoles y validate; añadir helper multisucursal si se implementa. |
| `backend/src/middleware/requireAuth.js` | Middleware transversal; reutilizar requireAuth, authorizeRoles y validate; añadir helper multisucursal si se implementa. |
| `backend/src/middleware/validate.js` | Middleware transversal; reutilizar requireAuth, authorizeRoles y validate; añadir helper multisucursal si se implementa. |
| `backend/src/models/AsientoContable.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Categoria.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/CierreContable.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/CuentaContable.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/CuentaPorPagar.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/DetalleDevolucion.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/DetalleOrdenCompra.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/DetalleVenta.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Devolucion.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Empleado.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/LineaAsiento.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/LineaPresupuesto.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/LogAuditoria.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Lote.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/OrdenCompra.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/PagoProveedor.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Presupuesto.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Producto.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Proveedor.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Rol.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Sucursal.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/Venta.js` | Modelo Sequelize existente; no romper tablas. Agregar nuevos modelos; ajustar Sucursal/Empleado solo si falta atributo o asociación. |
| `backend/src/models/index.js` | Registro central de modelos/asociaciones; modificar para Sucursal, Traspaso, DetalleTraspaso, AccesoBiometrico, DispositivoBiometrico. |
| `backend/src/repositories/asiento.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/auditoria.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/categoria.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/cierre.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/cuenta-por-pagar.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/cuenta.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/devolucion.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/empleado.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/libro-fiscal.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/libro.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/lote.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/orden-compra.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/presupuesto.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/producto.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/proveedor.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/reporte.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/usuario.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/repositories/venta.repository.js` | Repositorio de datos; mantener Sequelize aislado. Agregar repositorios nuevos y extender lote/sucursal según contratos. |
| `backend/src/routes/asiento.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/auditoria.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/auth.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/cierre.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/cuenta-por-pagar.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/cuenta.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/dashboard.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/evento.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/health.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/index.js` | Agregador de rutas /api; registrar /sucursales, /inventario, /traspasos, /accesos-biometricos, /dispositivos-biometricos. |
| `backend/src/routes/libro-fiscal.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/libro.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/orden-compra.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/presupuesto.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/producto.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/proveedor.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/reporte.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/usuario.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/routes/venta.routes.js` | Rutas de recurso; reutilizar requireAuth/RBAC/validate. Añadir rutas nuevas sin alterar endpoints existentes. |
| `backend/src/server.js` | Bootstrap servidor; sin cambios. |
| `backend/src/services/accounting.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/asiento.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/audit.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/auditoria.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/auth.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/categoria.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/cierre.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/cuenta-por-pagar.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/cuenta.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/dashboard-gerencial.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/dashboard.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/devolucion.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/libro-fiscal.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/libro.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/orden-compra.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/presupuesto.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/producto.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/proveedor.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/reporte.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/token.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/usuario.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/services/venta.service.js` | Servicio de negocio; seguir patrón createXxxService con inyección. Agregar reglas multisucursal/traspaso/biometría aquí. |
| `backend/src/utils/ApiError.js` | Utilidades compartidas; reutilizar ApiError, asyncHandler y money; no duplicar errores. |
| `backend/src/utils/asyncHandler.js` | Utilidades compartidas; reutilizar ApiError, asyncHandler y money; no duplicar errores. |
| `backend/src/utils/money.js` | Utilidades compartidas; reutilizar ApiError, asyncHandler y money; no duplicar errores. |
| `backend/src/validators/asiento.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/auth.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/cierre.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/cuenta-por-pagar.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/cuenta.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/dashboard.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/evento.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/libro-fiscal.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/libro.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/orden-compra.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/presupuesto.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/producto.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/proveedor.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/reporte.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/usuario.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/src/validators/venta.validators.js` | Contratos Zod; añadir schemas para sucursales, inventario, traspasos y biometría. |
| `backend/tests/accounting.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/app.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/asiento.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/auth.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/cierre.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/cuenta-por-pagar.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/cuenta.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/dashboard-gerencial.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/dashboard.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/devolucion.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/flujo-caja.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/libro-fiscal.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/libro.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/orden-compra.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/presupuesto.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/producto.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/proveedor.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/reporte.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/usuario.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `backend/tests/venta.service.test.js` | Tests Jest existentes; no romper. Añadir tests de services y rutas para nuevos contratos. |
| `docker-compose.yml` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `docs/compose/plans/etapas-8-9-plan.md` | Documentación del proyecto; actualizar al finalizar implementación para continuidad. |
| `frontend/.dockerignore` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/.env.template` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/Dockerfile` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/babel.config.cjs` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/eslint.config.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/index.html` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/jest.config.cjs` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/jest.setup.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/nginx.conf` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/package-lock.json` | Lockfile npm generado; no editar manualmente; actualizar solo con npm install si cambian dependencias. |
| `frontend/package.json` | Scripts y dependencias; modificar solo si se añaden librerías, lo cual no es necesario para esta spec. |
| `frontend/postcss.config.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/src/App.jsx` | Entrada React; sin cambios. |
| `frontend/src/components/layout/AppShell.jsx` | Layout/sidebar/topbar/nav; actualizar navItems para nuevas secciones y opcionalmente mostrar sucursal activa. |
| `frontend/src/components/layout/Sidebar.jsx` | Layout/sidebar/topbar/nav; actualizar navItems para nuevas secciones y opcionalmente mostrar sucursal activa. |
| `frontend/src/components/layout/Topbar.jsx` | Layout/sidebar/topbar/nav; actualizar navItems para nuevas secciones y opcionalmente mostrar sucursal activa. |
| `frontend/src/components/layout/navItems.js` | Layout/sidebar/topbar/nav; actualizar navItems para nuevas secciones y opcionalmente mostrar sucursal activa. |
| `frontend/src/components/ui/Badge.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Button.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Button.test.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Card.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/EmptyState.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Input.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Modal.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/PageHeader.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Select.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/Spinner.jsx` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/components/ui/index.js` | Design system reusable; usar en nuevas páginas, no crear estilos paralelos. |
| `frontend/src/index.css` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/src/lib/access.js` | Helpers frontend; extender access.js para nuevos permisos y reutilizar format/pdf. |
| `frontend/src/lib/cn.js` | Helpers frontend; extender access.js para nuevos permisos y reutilizar format/pdf. |
| `frontend/src/lib/format.js` | Helpers frontend; extender access.js para nuevos permisos y reutilizar format/pdf. |
| `frontend/src/lib/pdf.js` | Helpers frontend; extender access.js para nuevos permisos y reutilizar format/pdf. |
| `frontend/src/main.jsx` | Entrada React; sin cambios. |
| `frontend/src/pages/Asientos.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Auditoria.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/BalanceGeneral.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Cierres.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Cuentas.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/CuentasPorPagar.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Dashboard.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/EjecucionPresupuesto.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/EstadoResultados.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/FlujoCaja.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/LibroCompras.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/LibroDiario.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/LibroMayor.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/LibroVentas.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Login.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Login.test.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/OrdenesCompra.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Placeholder.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Presupuestos.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Productos.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Proveedores.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/PuntoVenta.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/ReporteVentas.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/SimuladorEventos.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Usuarios.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/pages/Ventas.jsx` | Pantallas existentes; agregar nuevas páginas y modificar POS/reportes para contexto multisucursal. |
| `frontend/src/queries/queryClient.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useAsientos.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useAuditoria.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useCierres.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useCuentas.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useCuentasPorPagar.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useDashboard.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useEventos.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useLibros.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useLibrosFiscal.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useOrdenesCompra.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/usePresupuestos.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useProductos.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useProveedores.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useReportes.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useUsuarios.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/queries/useVentas.js` | React Query hooks; añadir hooks e invalidación de caches de inventario/ventas/dashboard. |
| `frontend/src/router/AppRouter.jsx` | Rutas protegidas; registrar nuevas páginas con roles correctos. |
| `frontend/src/router/ProtectedRoute.jsx` | Rutas protegidas; registrar nuevas páginas con roles correctos. |
| `frontend/src/services/api.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/asientos.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/auditoria.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/auth.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/cierres.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/cuentas-por-pagar.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/cuentas.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/dashboard.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/eventos.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/libros-fiscal.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/libros.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/ordenes-compra.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/presupuestos.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/productos.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/proveedores.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/reportes.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/usuarios.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/services/ventas.service.js` | Cliente API por recurso; añadir services nuevos para contratos. |
| `frontend/src/store/AuthContext.jsx` | AuthContext; reutilizar user.id_sucursal del JWT/perfil; no duplicar auth. |
| `frontend/tailwind.config.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `frontend/vite.config.js` | Configuración de entorno/build/test/estilo; no requiere cambio salvo registrar variables opcionales si se decide secreto de dispositivo vía env. |
| `package.json` | Scripts y dependencias; modificar solo si se añaden librerías, lo cual no es necesario para esta spec. |
