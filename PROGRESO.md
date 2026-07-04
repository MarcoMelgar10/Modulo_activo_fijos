# Progreso del Desarrollo — Módulo de Contabilidad (Flowy ERP)

> Documento de avance para el equipo. Se actualiza al cerrar cada etapa del plan.

**Última actualización:** 2026-07-03
**Etapa actual:** ✅ Todo el ERP salvo lo excluido + ✅ **Dashboard gerencial (RF-REP-01)** → ⏭️ pendiente solo: inventario avanzado (RF-INV-03/04/05), multi-sucursal (RF-USR-05), export Excel (RF-REP-02)
**Stack:** Node 20 + Express + Sequelize + MySQL 8 + Redis 7 (backend) · React 18 + Vite + Tailwind (frontend)

## Resumen de estado

| Etapa | Descripción | Estado |
|-------|-------------|--------|
| 0 | Fundaciones / Scaffolding | ✅ Completada |
| 1 | Auth, RBAC y Auditoría | ✅ Completada |
| 2 | Plan de Cuentas | ✅ Completada |
| 3 | Asientos manuales (partida doble) | ✅ Completada |
| 4 | Generación automática (API de eventos) | ✅ Completada |
| 5 | Libros contables (Diario/Mayor) | ✅ Completada |
| 6 | Estados financieros | ✅ Completada |
| 7 | Cierre de gestión | ✅ Completada |
| 8 | Dashboard + cumplimiento fiscal SIN | ✅ Completada |
| 9 | Pruebas, calidad y despliegue | ✅ Completada |
| C1 | **Compras y Proveedores** (RF-COM-01..04) + base de inventario | ✅ Completada |
| V1 | **Ventas y POS** (RF-VEN-01..04) + devoluciones | ✅ Completada |
| U1 | **Usuarios y RBAC por rol** (RF-USR-02/04) | ✅ Completada |
| R1 | **Export PDF + Auditoría (RF-REP-03) + Flujo de Caja (RF-CON-03)** | ✅ Completada |
| 10 | **Presupuesto**: definición y aprobación (RF-PRE-01/02) | ✅ Completada |
| 11 | **Presupuesto**: ejecución y reportes (RF-PRE-03/04/05) | ✅ Completada |

> **Nota de alcance:** además de Contabilidad, el proyecto incluye el **módulo de Presupuesto**
> (Fase B, Etapas 10–11), que se desarrolla tras Contabilidad porque su control de ejecución se
> apoya en los asientos contables. Documentado en `documentacion.md` (3.5.7, 3.6.5) y en el plan.

---

## ✅ Etapa 0 — Fundaciones / Scaffolding (2026-06-22)

**Objetivo:** entorno reproducible y base técnica sólida para construir el módulo.

### Entregado
**Raíz**
- `.gitignore`, `.editorconfig`, `README.md`, `docker-compose.yml` (MySQL 8 + Redis 7 + backend + frontend).
- CI en `.github/workflows/ci.yml`: lint + test (backend) y lint + test + build (frontend).

**Backend** (`backend/`) — arquitectura en capas (routes → controller → service → repository → model)
- Express 4 con `helmet`, `cors`, `express-rate-limit`, parser JSON.
- Config centralizada: `env.js`, `logger.js` (Winston), `database.js` (Sequelize/MySQL), `redis.js`.
- Manejo de errores uniforme: `ApiError`, `asyncHandler`, `errorHandler`, `notFound`.
- Endpoint **`GET /health`** que verifica API + MySQL + Redis.
- Sequelize CLI configurado (`.sequelizerc`, `database/config.cjs`) para migraciones/seeders.
- ESLint 9 (flat config) + Prettier. Dockerfile.
- Pruebas Jest + Supertest: **2/2 ✓**.

**Frontend** (`frontend/`) — React 18 + Vite + Tailwind
- Design system minimalista en `components/ui`: `Button`, `Card`, `Input`, `Badge`, `Spinner`,
  `EmptyState`, `PageHeader` (paleta neutra + un acento sobrio, fuente Inter).
- Layout `AppShell` (Sidebar + Topbar) con navegación por secciones.
- Router (React Router v6), React Query (`queryClient`), cliente Axios único (`services/api.js`).
- Páginas: `Dashboard` (con widget de estado del sistema en vivo) y `Placeholder` para secciones futuras.
- ESLint + Prettier + Jest + Testing Library. Dockerfile (build + Nginx).
- Pruebas: **2/2 ✓**. Build de producción: **✓**.

### Verificación realizada
- `backend`: `npm run lint` ✓ · `npm test` ✓ (2 pruebas).
- `frontend`: `npm run lint` ✓ · `npm test` ✓ (2 pruebas) · `npm run build` ✓.

### Cómo levantarlo
```bash
docker compose up --build        # entorno completo
# o en local:
cd backend && npm install && npm run dev    # http://localhost:4000/health
cd frontend && npm install && npm run dev   # http://localhost:5173
```

### Decisiones técnicas
- Lenguaje **JavaScript ES2022 (ESM)**, según la documentación del proyecto.
- Auth se construirá embebida y mínima (login JWT + RBAC) en la Etapa 1.
- Asientos automáticos (RF-CON-01) vía **API de eventos contables** + seeders (Etapa 4).
- `eslint-plugin-react-hooks` se fijó en v5 por compatibilidad con ESLint 9.

---

## ✅ Etapa 1 — Auth, RBAC y Auditoría (2026-06-22)

**Objetivo:** autenticación segura, control de acceso por rol y trazabilidad de acciones
(RF-USR subset, RNF-04/05/06, RF-REP-03 base).

### Entregado
**Backend**
- Modelos Sequelize: `Rol`, `Sucursal`, `Empleado`, `LogAuditoria` con asociaciones.
- Migración `database/migrations/...-auth.cjs` y seeder con roles, sucursal y usuarios demo.
- Login **JWT + bcrypt** (costo ≥10), bloqueo tras 5 intentos (`bloqueado_hasta`).
- Sesión en **Redis** con `jti` → permite **logout/revocación** real del token.
- Middleware `requireAuth` (verifica JWT + sesión activa) y `authorizeRoles` (RBAC).
- Validación de entrada con Zod (`validateBody`), rate-limit en `/login`.
- Auditoría inmutable en `log_auditoria` (LOGIN / LOGIN_FALLIDO / LOGOUT).
- Endpoints: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.

**Frontend**
- `AuthContext` (token en localStorage, restauración de sesión vía `/me`, auto-logout ante 401).
- Página **Login** minimalista (design system), rutas protegidas (`ProtectedRoute`) con guard por rol.
- Topbar con usuario real, rol y botón de salir.

### Verificación realizada (end-to-end con Docker)
- `docker compose up mysql redis` → migraciones y seeders aplicados ✓.
- `GET /health` → `{ server, database, redis }` todos `ok` ✓.
- Login correcto → token JWT + usuario (sin exponer `password_hash`) ✓.
- Login incorrecto → 401 genérico ✓.
- `GET /me` con token ✓ / sin token → 401 ✓.
- `logout` → token revocado en Redis; `GET /me` posterior → "Sesión finalizada" ✓.
- Auditoría registrada en MySQL (LOGIN, LOGIN_FALLIDO, LOGOUT) ✓.
- Pruebas: backend 6/6 ✓ · frontend 3/3 ✓ · lint ✓ en ambos.

### Usuarios demo
| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `contador` | `Contador123` | CONTADOR |
| `gerente` | `Gerente123` | GERENTE |

---

## ✅ Etapa 2 — Plan de Cuentas (2026-06-22)

**Objetivo:** gestión del plan de cuentas jerárquico (RF-CON-04 base).

### Entregado
**Backend**
- Modelo `CuentaContable` con auto-relación (padre/subcuentas), `tipo`
  (ACTIVO/PASIVO/PATRIMONIO/INGRESO/GASTO), `nivel` y `permite_movimiento`.
- Migración `...-cuenta-contable.cjs` y seeder con **31 cuentas** del plan boliviano base.
- Servicio con reglas: código único, herencia de tipo/nivel desde el padre, una cuenta con
  subcuentas pasa a agrupación (no permite movimiento), no se elimina si tiene subcuentas.
- Endpoints: `GET /api/cuentas`, `GET /api/cuentas/arbol`, `GET /api/cuentas/:id`,
  `POST/PUT/DELETE` (crear/editar/eliminar solo CONTADOR).
- `seederStorage: sequelize` → `db:seed:all` ahora es idempotente.

**Frontend**
- Página **Plan de cuentas** con vista de **árbol** jerárquico (indentación por nivel,
  badges por tipo, indicador de movimiento).
- Modal de alta de cuenta (código, nombre, padre, tipo) con React Query (invalidación de caché).
- Nuevos componentes de design system: `Modal`, `Select`.

### Verificación realizada (end-to-end con Docker)
- Seeder: 31 cuentas (ACTIVO 10, PASIVO 6, PATRIMONIO 5, INGRESO 4, GASTO 6) ✓.
- `GET /cuentas/arbol` → 5 raíces con sus subcuentas ✓.
- Crear hija de "1.1" → hereda tipo ACTIVO, nivel 3 ✓.
- Código duplicado → 409 ✓.
- RBAC: GERENTE no puede crear cuentas → 403 (solo CONTADOR) ✓.
- Pruebas: backend 10/10 ✓ · frontend 3/3 ✓ · build frontend ✓ · lint ✓.

---

## ✅ Etapa 3 — Asientos Contables manuales (2026-06-22)

**Objetivo:** registrar asientos con partida doble (RF-CON-01 parcial, base manual).

### Entregado
**Backend**
- Modelos `AsientoContable` (cabecera) y `LineaAsiento` (detalle) con asociaciones
  (asiento 1→* líneas; línea → cuenta; asiento → sucursal). Migración `...-asientos.cjs`.
- Servicio con reglas de negocio:
  - `validarPartidaDoble` (lógica pura, testeable): ≥2 líneas, cada línea Debe XOR Haber,
    Σdebe = Σhaber y > 0. Comparación en **centavos** (sin errores de coma flotante).
  - Validación de cuentas: deben existir y tener `permite_movimiento = true`.
  - **Numeración correlativa** por año: `AST-AAAA-00001`.
  - Estados: crea en BORRADOR; `confirmar()` (re-valida cuadre → CONFIRMADO);
    `anular()` (CONFIRMADO → ANULADO). Creación en **transacción Sequelize**.
- Endpoints: `GET /api/asientos` (filtros fecha/estado/origen), `GET /:id`,
  `POST /` (crear borrador), `POST /:id/confirmar`, `POST /:id/anular`.

**Frontend**
- Página **Asientos** con tabla (número, fecha, concepto, origen, importe, estado) y acciones
  Confirmar/Anular según estado.
- **Editor de asiento** (modal) con líneas dinámicas (agregar/quitar), selector de cuenta hoja,
  campos Debe/Haber mutuamente excluyentes y **validación de cuadre en vivo** (totales y
  descuadre; botón Guardar deshabilitado si no balancea).

### Verificación realizada (end-to-end con Docker)
- Crear balanceado (Caja/Ventas/IVA) → BORRADOR, número `AST-2026-00003`, 3 líneas ✓.
- Confirmar → CONFIRMADO ✓ · Anular → ANULADO ✓.
- Crear desbalanceado (Debe ≠ Haber) → 400 ✓.
- Crear con cuenta de agrupación → 400 ("no admite movimientos") ✓.
- Pruebas: backend **20/20** ✓ · frontend 3/3 ✓ · build ✓ · lint ✓.

### Bug encontrado y corregido
- `findById` se ejecutaba dentro de la transacción sin commit → devolvía null. Se corrigió
  devolviendo el id desde la transacción y consultando tras el commit.

### Pendiente / Próxima etapa
➡️ **Etapa 4 — Generación automática (AccountingService + API de eventos):** endpoint
`POST /api/eventos-contables` (capa anticorrupción) para VENTA/COMPRA/DEVOLUCION/PAGO, con
estrategias de mapeo evento→asiento (reutilizando `asientoService.crear` con `tipo_origen`),
y seeders de eventos demo que produzcan asientos reales.

---

## Actualización al 2026-06-28 — Etapas 4 a 7

> Backend de las Etapas 4, 5 y 6 implementado por el equipo. En esta iteración se
> añadió la **Etapa 7 (Cierre de gestión)**, se **corrigió el Balance General** de
> la Etapa 6 y se limpió el repositorio (se quitaron `.env` y archivos temporales).
> Pruebas: **backend 57/57 ✓ · frontend 3/3 ✓** (verificadas con Jest).

### Etapa 4 — Generación automática de asientos ✅ (revisada, sin cambios de lógica)
- `services/accounting.service.js`: estrategias por tipo de evento (VENTA, COMPRA,
  DEVOLUCION, PAGO) con patrón OCP; cálculo de IVA 13% (Bolivia, "por dentro").
  Genera el asiento CONFIRMADO en una transacción reutilizando `asientoService.crear`.
- `controllers/evento.controller.js`, `routes/evento.routes.js`, `validators/evento.validators.js`.
- Migración `...add-pago-tipo-origen.cjs` (añade `PAGO` al enum) y seeder de eventos demo.
- API: `POST /api/eventos-contables`. Frontend: página **Simulador ERP** (`/simulador-erp`).
- Nota: VENTA/COMPRA se registran al contado (Caja). Las ventas/compras a crédito
  (Cuentas por Cobrar/Pagar) quedan como mejora futura — es una simplificación, no un error.

### Etapa 5 — Libros Diario y Mayor ✅ (revisada, correcta)
- `services/libro.service.js` + `repositories/libro.repository.js`: Libro Diario
  (líneas confirmadas del período con totales y flag de cuadre) y Libro Mayor
  (saldo inicial + movimientos con saldo acumulado, según naturaleza deudora/acreedora).
- `controllers/libro.controller.js`, `routes/libro.routes.js`, `validators/libro.validators.js`.
- API: `GET /api/libros/diario`, `GET /api/libros/mayor` (filtros de fecha; el Mayor exige `id_cuenta`).
- Frontend (implementado por el equipo): páginas **Libro Diario** y **Libro Mayor** (`/libro-diario`, `/libro-mayor`).

### Etapa 6 — Estados financieros ✅ (corregida)
- `services/reporte.service.js` + `repositories/reporte.repository.js`: Balance General
  y Estado de Resultados con propagación jerárquica de saldos.
- **Corrección aplicada (Balance General):**
  1. Ahora usa **saldos acumulados hasta `fecha_fin`** (`getTotalesAcumulados`, `fecha <= fecha_fin`),
     no solo el rango. Un balance es una foto a una fecha, no un movimiento de período.
  2. Incorpora el **resultado del ejercicio** (Ingresos − Gastos) al patrimonio, de modo que
     `Activo = Pasivo + Patrimonio` se cumple incluso **antes** del cierre. Tras el cierre el
     término vale 0 (no hay doble conteo).
- El Estado de Resultados se mantiene por rango (correcto: cuentas de flujo).
- API: `GET /api/reportes/balance-general`, `GET /api/reportes/estado-resultados`.
- Frontend (implementado por el equipo): **Balance General** y **Estado de Resultados** (`/balance-general`, `/estado-resultados`).

### Etapa 7 — Cierre de gestión (anual) ✅ NUEVO
- Modelo `CierreContable` + migración `...cierre-contable.cjs` (tabla con FKs, índice y
  unique por gestión).
- `services/cierre.service.js`: cierra una gestión anual, genera el **asiento de cierre**
  (traslada el resultado a la cuenta de patrimonio 3.2.1 "Resultado del Ejercicio") como
  asiento CONFIRMADO, y registra el período como CERRADO.
- **Bloqueo de período:** `asiento.service` ahora impide crear/confirmar/anular asientos cuya
  fecha caiga en una gestión cerrada.
- `repositories/cierre.repository.js`, `validators/cierre.validators.js`,
  `controllers/cierre.controller.js`, `routes/cierre.routes.js`.
- Frontend: `pages/Cierres.jsx` + `services/cierres.service.js` + `queries/useCierres.js`
  (página conectada en `/cierres`, reemplaza el Placeholder).
- API: `GET /api/cierres`, `GET /api/cierres/:id`, `POST /api/cierres` (cerrar, solo CONTADOR).

### Higiene del repositorio
- Se eliminaron del proyecto: `backend/.env` (no debe versionarse; usar `.env.template`),
  `*.txt` de logs, `error.md`, `paso*.md`, `implementation_plan.md` y un `GUIA_CONTINUIDAD.md`
  duplicado dentro de `backend/`.

---

## ✅ Etapa 8 — Dashboard + Cumplimiento Fiscal SIN (2026-07-01)

**Objetivo:** dashboard ejecutivo con KPIs fiscales y Libro de Compras/Ventas (normativa SIN boliviana).

### Entregado
**Backend**
- `services/dashboard.service.js`: compone `reporteService`, `reporteRepo` y `cierreRepo` (DIP).
- `repositories/reporte.repository.js`: método `getIVAPorPeriodo()` — IVA débito (2.1.2) y crédito (1.1.5) del período.
- `services/libro-fiscal.service.js`: Libro de Compras/Ventas con IVA desglosado por asiento.
- `repositories/libro-fiscal.repository.js`: query por `tipo_origen` + rango de fechas.
- Controllers, routes, validators (Zod) para ambos recursos.
- Endpoints: `GET /api/dashboard?gestion=&mes=`, `GET /api/libros-fiscales/compras`, `GET /api/libros-fiscales/ventas`.
- Tests: `dashboard.service.test.js` (6 tests), `libro-fiscal.service.test.js` (6 tests).

**Frontend**
- `pages/Dashboard.jsx` mejorado: KPIs (utilidad, IVA débito/crédito/neto), selector de mes, estado cierre.
- `pages/LibroCompras.jsx` y `pages/LibroVentas.jsx`: tabla con IVA desglosado + exportar CSV.
- Services, queries (React Query hooks) para ambos recursos.
- Sidebar actualizado: "Libro de Compras" y "Libro de Ventas" en sección Reportes Financieros.

### Verificación
- Backend: **69/69 tests** ✓ · lint limpio ✓
- Frontend: 3/3 tests ✓ · lint limpio ✓ · build OK ✓
- Endpoints probados con curl: dashboard, compras, ventas — datos correctos ✓
- Playwright: login, dashboard con KPIs, sidebar actualizado, navegación OK ✓

---

## ✅ Etapa 9 — Preparación para Despliegue (2026-07-01)

**Objetivo:** dejar el proyecto deploy-ready para cualquier PaaS o VPS.

### Entregado
- `backend/Dockerfile`: multi-stage (`deps` + `producción`) con health check.
- `frontend/Dockerfile`: multi-stage (`build` + `nginx`) con health check.
- `.github/workflows/ci.yml`: job `docker` que verifica build de ambas imágenes.
- `package.json` raíz: scripts de conveniencia (`dev`, `test`, `lint`, `db:migrate`, `db:seed`).
- `DEPLOY.md`: guía de despliegue con Docker Compose y manual.
- `backend/.env.template`: sección de producción documentada.
- `.gitignore`: mejorado (Playwright, MiMoCode, Docker, etc.).

### Verificación
- `docker build -t contabilidad-backend ./backend` ✓
- `docker build -t contabilidad-frontend ./frontend` ✓
- Backend 69/69 tests ✓ · Frontend 3/3 tests ✓ · lint limpio en ambos ✓

---

### Para continuar (siguiente quien retome)
1. `cd backend && npm install && npm run db:migrate && npm run db:seed`.
2. `npm test` para verificar (69 pruebas backend).
3. **Siguiente parte: Etapa 10 — Presupuesto (definición y aprobación, RF-PRE-01/02).**

> UI del módulo de Contabilidad COMPLETA: Login, Dashboard (KPIs fiscales), Plan de
> cuentas, Asientos, Simulador ERP, Libro Diario, Libro Mayor, Balance General,
> Estado de Resultados, Cierre de gestión, **Libro de Compras**, **Libro de Ventas**.

---

## ✅ Módulo Compras y Proveedores — RF-COM-01..04 (2026-07-03)

**Objetivo:** implementar de forma real (no simulada) el módulo de Compras del ERP y su
integración contable, de modo que las compras y los pagos a proveedores se reflejen en los
libros y estados financieros. Incluye la base mínima de inventario (productos y lotes) que
las compras requieren.

### Corrección previa (bug reportado)
- **Simulador ERP:** la pantalla enviaba un payload (`tipo_evento`, `monto_bruto`) que no
  coincidía con el contrato del backend (`tipo`, `monto_total`, `fecha`, `referencia_id`),
  por lo que siempre devolvía **400 Datos inválidos**. Se alineó `SimuladorEventos.jsx` al
  contrato real de `/api/eventos-contables`. Ahora la simulación genera el asiento de punta a punta.

### Entregado — Backend
**Proveedores (RF-COM-01)** — CRUD completo con NIT único y baja lógica.
- `models/Proveedor.js`, `migrations/...-proveedores.cjs`, `repositories/proveedor.repository.js`,
  `services/proveedor.service.js`, `validators/proveedor.validators.js`,
  `controllers/proveedor.controller.js`, `routes/proveedor.routes.js`, seeder demo (3 proveedores).

**Productos / Categorías / Lotes (base de inventario, RF-INV-01 parcial)**
- `models/Categoria.js`, `models/Producto.js`, `models/Lote.js`, `migrations/...-inventario.cjs`.
- CRUD completo de productos (código de barras único; `precio_venta > precio_compra`) y
  categorías (listar/crear). `repositories` y `services` propios. Seeder: 3 categorías + 6 productos.

**Órdenes de compra y recepción (RF-COM-02/03)**
- `models/OrdenCompra.js` + `models/DetalleOrdenCompra.js`, `migrations/...-ordenes-compra.cjs`.
- Ciclo de estados **BORRADOR → ENVIADA → RECIBIDA** (o **CANCELADA**). Numeración correlativa
  `OC-AAAA-#####`.
- **Recepción (`recibir`)**: en una sola operación (1) crea un **lote de inventario** por línea
  recibida, (2) genera el **asiento contable CONFIRMADO** (Debe Inventario 1.1.4 + IVA Crédito
  1.1.5 · Haber Caja 1.1.1 si es **CONTADO** o Cuentas por Pagar 2.1.1 si es **CRÉDITO**), con
  IVA 13% "por dentro" y en centavos, y (3) si es a crédito, registra la **cuenta por pagar**.

**Cuentas por pagar y pagos (RF-COM-04)**
- `models/CuentaPorPagar.js` + `models/PagoProveedor.js`, `migrations/...-cuentas-por-pagar.cjs`.
- Registro de **pagos parciales/totales**: cada pago genera su asiento CONFIRMADO
  (Debe Cuentas por Pagar 2.1.1 / Haber Caja 1.1.1), disminuye el `saldo_pendiente` y actualiza
  el estado **PENDIENTE → PARCIAL → PAGADA**. Al ser asientos reales, **se reflejan en Libro
  Diario, Mayor y Balance General** (lo pedido explícitamente: que no sean solo visuales).

**Cableado**
- Asociaciones nuevas en `models/index.js`; rutas montadas en `routes/index.js`
  (`/proveedores`, `/productos`, `/ordenes-compra`, `/cuentas-por-pagar`).
- Auditoría de acciones en `log_auditoria` (módulos COMPRAS / INVENTARIO).

### Entregado — Frontend
- Services + hooks React Query: `proveedores`, `productos`, `ordenes-compra`, `cuentas-por-pagar`.
- Páginas: **Proveedores** (CRUD), **Productos** (CRUD + categorías), **Órdenes de compra**
  (alta con líneas dinámicas, enviar, **recibir**, cancelar) y **Cuentas por pagar**
  (registro de pagos). Nuevas secciones de sidebar **Compras** e **Inventario**.
- Al recibir una orden o registrar un pago se invalidan las cachés de asientos, libros y
  reportes para que la contabilidad se actualice en vivo.

### Tests
- `proveedor.service.test.js`, `producto.service.test.js`, `orden-compra.service.test.js`
  (partida doble de la recepción contado/crédito, creación de lotes y CxP),
  `cuenta-por-pagar.service.test.js` (asiento del pago, saldo y transición de estado).

### Tablas nuevas
`proveedor`, `categoria`, `producto`, `lote`, `orden_compra`, `detalle_orden_compra`,
`cuenta_por_pagar`, `pago_proveedor`.

### Cómo aplicar
```bash
cd backend
npm run db:migrate     # crea las 8 tablas nuevas
npm run db:seed        # proveedores + categorías + productos demo (idempotente)
npm test               # verifica los services
```

### Notas y decisiones
- **Roles:** el módulo lo operan **GERENTE y CONTADOR** (roles existentes en el seeder).
- **Nombres de producto en lotes:** si en la recepción no se detalla número/vencimiento de lote,
  se generan por defecto (`LOTE-<orden>-<producto>`, vencimiento a 1 año) para no frenar el flujo.
- **Atomicidad:** siguiendo el patrón existente (`accounting.service`), el asiento se crea en su
  propia transacción y luego se registran lotes/CxP; es una simplificación consciente y coherente
  con el resto del proyecto.
- **⚠️ Alcance del informe:** el documento oficial define además RF-VEN (Ventas/POS) y RF-INV
  completo (lotes FEFO, alertas, biométrico, traspasos). Aquí se construyó Compras y la base de
  inventario que necesita; el resto queda pendiente.

---

## ✅ Módulo Ventas y POS — RF-VEN-01..04 (2026-07-03)

**Objetivo:** implementar el punto de venta con descuento real de inventario (FEFO), devoluciones
y reportes, todo integrado con la contabilidad (asientos automáticos).

### Entregado — Backend
**Ventas / POS (RF-VEN-01/02)**
- `models/Venta.js` + `models/DetalleVenta.js`, `migrations/...-ventas.cjs`.
- `services/venta.service.js`: registra la venta como **COMPLETADA** con numeración `VTA-AAAA-#####`.
  - **FEFO (RF-VEN-02):** descuenta el stock tomando los lotes con vencimiento más próximo
    primero; una línea puede consumir varios lotes (se genera un `detalle_venta` por lote).
  - Calcula subtotal, aplica **descuento** a nivel de venta y registra el **método de pago**.
  - Genera el **asiento CONFIRMADO** (Debe Caja o Bancos según el medio · Haber Ventas 4.1.1 +
    IVA Débito 2.1.2), IVA 13% "por dentro". Venta + líneas + descuento de lotes en transacción.
- Cobro por método de pago: `EFECTIVO`→Caja 1.1.1; `TARJETA_*`/`QR`→Bancos 1.1.2.

**Devoluciones (RF-VEN-03)**
- `models/Devolucion.js` + `models/DetalleDevolucion.js`, `services/devolucion.service.js`.
- Repone el stock en los lotes originales, genera el **asiento de reversa** (Debe Devoluciones
  sobre Ventas 4.1.2 + IVA Débito 2.1.2 · Haber Caja/Bancos) y marca la venta como
  **DEVOLUCION_PARCIAL**.

**Reporte de ventas (RF-VEN-04)**
- `GET /api/ventas/reporte`: totales (cantidad, subtotal, descuento, total) y **comparativa por
  sucursal**, con filtros por fecha, sucursal, cajero, producto y método de pago.

**Utilidad compartida:** se agregó `ivaPorDentro()` a `utils/money.js` (reutilizado por ventas y
devoluciones). Helper FEFO en `repositories/lote.repository.js` (`findDisponiblesFEFO`,
`descontar`, `reponer`).

### Entregado — Frontend
- Services + hooks (`ventas`), y páginas: **Punto de venta** (carrito + método de pago +
  descuento), **Historial de ventas** (con modal de **devolución**) y **Reporte de ventas**
  (KPIs + comparativa por sucursal). Nueva sección de sidebar **Ventas**.

### Tests
- `venta.service.test.js` (partida doble, FEFO multi-lote, cobro a Bancos, stock insuficiente,
  descuento) y `devolucion.service.test.js` (reposición de stock + asiento de reversa, validaciones).

### Tablas nuevas
`venta`, `detalle_venta`, `devolucion`, `detalle_devolucion`.

### Decisiones (confirmadas con el cliente)
- **POS operado por CONTADOR/GERENTE**; se registra al usuario logueado como cajero. El login
  propio de cajeros queda para la etapa de gestión de usuarios (rutas ya habilitan CAJERO).
- **Sin asiento de costo de ventas:** el stock del lote baja físicamente por FEFO, pero no se
  genera el asiento Costo/Inventario (decisión del cliente). El inventario contable (1.1.4) no
  disminuye con la venta; sí lo hace el stock.
- **Método de pago → cuenta:** efectivo a Caja; tarjeta/QR a Bancos.

### Cómo aplicar
```bash
cd backend && npm run db:migrate && npm test
```

---

## ✅ Gestión de Usuarios y RBAC por rol — RF-USR-02/04 (2026-07-03)

**Objetivo:** que el **GERENTE** (administrador) cree usuarios y les asigne un rol, y que ese rol
determine a qué módulos accede cada usuario. Los roles siguen viniendo del **seeder** (no se crean
en runtime). Registro de sesiones y multi-sucursal quedan como estaban (fuera de alcance por ahora).

### Entregado — Backend
- `repositories/usuario.repository.js`, `services/usuario.service.js` (crear con **hash bcrypt**,
  editar, activar/desactivar con baja lógica, listar roles; no permite auto-desactivarse),
  `validators/usuario.validators.js`, `controllers/usuario.controller.js`,
  `routes/usuario.routes.js` (**solo GERENTE**). Registrado en `routes/index.js`.
- Endpoints: `GET/POST /api/usuarios`, `GET /api/usuarios/roles`, `GET /api/usuarios/:id`,
  `PUT /api/usuarios/:id`, `POST /api/usuarios/:id/estado`.
- **RBAC por especialidad** en las rutas de módulos (RF-USR-02):
  - CONTADOR → Contabilidad y Reportes · CAJERO → Ventas (+ lectura de catálogo para el POS) ·
    BODEGUERO → Inventario y Compras · GERENTE → todo + Usuarios.
- Seeder `...-usuarios-demo.cjs`: usuarios `cajero` y `bodeguero` para probar cada módulo.
- Test `usuario.service.test.js` (hash, usuario duplicado, rol inexistente, no auto-baja, reset de clave).

### Entregado — Frontend
- `lib/access.js` (mapa de acceso por rol + landing por rol), `navItems.js` con `roles`,
  `Sidebar.jsx` filtra las secciones según el rol, `AppRouter.jsx` con **guard por ruta** y
  **RoleHome** (cada rol aterriza en su módulo).
- Página **Usuarios** (solo GERENTE): alta con rol y contraseña, edición (incl. reseteo de clave),
  alta/baja. Services + hooks React Query.

### Usuarios demo (seeder)
| Usuario | Contraseña | Rol | Accede a |
|---------|-----------|-----|----------|
| `gerente` | `Gerente123` | GERENTE | Todo + Usuarios |
| `contador` | `Contador123` | CONTADOR | Contabilidad y reportes |
| `cajero` | `Cajero123` | CAJERO | Ventas / POS |
| `bodeguero` | `Bodeguero123` | BODEGUERO | Inventario y compras |

### Cómo aplicar
```bash
cd backend && npm run db:seed && npm test   # agrega cajero/bodeguero demo (idempotente)
```

### Notas
- **Registro de sesiones (RF-USR-03):** sin cambios (auditoría en `log_auditoria`).
- **Multi-sucursal (RF-USR-05):** en stand-by; los usuarios nuevos usan la sucursal 1 por defecto.
- **RF-USR-00 (auto-registro público):** no implementado por decisión del cliente; el alta la hace
  el GERENTE.

---

## ✅ Export PDF + Auditoría + Flujo de Caja — RF-REP-02/03, RF-CON-03 (2026-07-03)

### Export a PDF (RF-REP-02, parte PDF)
- Util `frontend/src/lib/pdf.js` con **jsPDF + jspdf-autotable** (import dinámico): encabezado
  "Flowy · ERP", título, rango/filtros y fecha de generación, tabla y líneas de resumen.
- Botón **Exportar PDF** en Balance General, Estado de Resultados, Libro Diario, Libro Mayor,
  Libro de Compras, Libro de Ventas, Reporte de Ventas y Flujo de Caja.
- **Requiere instalar dependencias:** `cd frontend && npm install` (se añadieron `jspdf` y
  `jspdf-autotable` a `package.json`).
- **Bug corregido de paso:** las páginas Balance General y Estado de Resultados leían claves que el
  backend no devuelve (`data.activo/pasivo/…` en vez de `data.cuentas`), por lo que mostraban
  "Sin datos". Se reescribieron para consumir la respuesta real (cuentas planas agrupadas por tipo)
  y ahora muestran los datos correctamente.

### Auditoría de acciones (RF-REP-03)
- Backend: `auditoria.repository`/`service`/`controller`/`routes` (**solo GERENTE**),
  `GET /api/auditoria` (filtros `desde`, `hasta`, `modulo`, `id_empleado`) y `/api/auditoria/modulos`.
  Lee el log inmutable `log_auditoria` (que ya se escribía en cada acción).
- Frontend: página **Auditoría** (sección Administración, solo GERENTE) con filtros y export PDF.

### Flujo de Caja (RF-CON-03)
- Backend: `reporte.repository` (`getSaldoCajaHasta`, `getMovimientosCajaPorOrigen`) y
  `reporte.service.generarFlujoCaja` (método directo): saldo inicial + entradas − salidas de las
  cuentas de efectivo (Caja 1.1.1, Bancos 1.1.2), desglosado por tipo de origen.
  `GET /api/reportes/flujo-caja`. Test `flujo-caja.service.test.js`.
- Frontend: página **Flujo de Caja** (Reportes Financieros) con KPIs, tabla por origen y export PDF.

### Cómo aplicar
```bash
cd frontend && npm install && npm run build   # instala jspdf y compila
cd ../backend && npm test                      # incluye el test de flujo de caja
```

---

## ✅ Módulo Presupuesto — RF-PRE-01..05 (2026-07-03)

**Objetivo:** planificar Ingresos y Gastos por gestión (anual) y controlar su ejecución contra la
contabilidad real. Es un módulo propio que **se apoya en Contabilidad** (la ejecución se calcula
desde los movimientos de asientos), sin mezclarse con sus archivos.

> **Nota de alcance:** RF-PRE no está en el informe `Ingenieria de software.md`; se construyó según
> los documentos internos del repo (control presupuestario apoyado en la contabilidad) y prácticas
> estándar. Decisiones confirmadas con el cliente: se presupuestan **Ingresos y Gastos**, período
> **anual por gestión**, el **CONTADOR define** y el **GERENTE aprueba**.

### Entregado — Backend
- Modelos `Presupuesto` + `LineaPresupuesto`, migración `...-presupuesto.cjs`, asociaciones.
- `presupuesto.repository`, `presupuesto.service`:
  - **Definición (RF-PRE-01):** crea presupuesto en BORRADOR con líneas por cuenta hoja de
    INGRESO/GASTO (valida tipo, movimiento y cuentas no repetidas). Editable solo en BORRADOR.
  - **Aprobación (RF-PRE-02):** el GERENTE aprueba/rechaza; no se permite aprobar dos para la
    misma gestión.
  - **Ejecución (RF-PRE-03/04/05):** compara planificado vs **real** (reutiliza
    `reporteRepository.getTotalesPorCuenta` de la gestión), calcula desviación, **% de ejecución**
    y **alertas** (SOBREGIRO en gastos, BAJO_META en ingresos); totales de utilidad plan vs real.
- Rutas `/api/presupuestos` (CONTADOR/GERENTE; aprobar/rechazar solo GERENTE). Test del service.

### Entregado — Frontend
- Nueva sección de sidebar **Presupuesto** (rol CONTADOR/GERENTE): página **Presupuestos**
  (definición con líneas dinámicas, aprobar/rechazar visible solo al GERENTE) y **Ejecución
  presupuestaria** (plan vs real con % y alertas, KPIs de utilidad y **export PDF**).

### Tablas nuevas
`presupuesto`, `linea_presupuesto`.

### Cómo aplicar
```bash
cd backend && npm run db:migrate && npm test
```

---

## ✅ Dashboard gerencial — RF-REP-01 (2026-07-03)

**Objetivo:** panel de KPIs del negocio en tiempo real para el GERENTE.

- **Backend:** `services/dashboard-gerencial.service.js` compone los repositorios de ventas,
  compras, cuentas por pagar e inventario + el resumen financiero del mes.
  `GET /api/dashboard/gerencial` (solo GERENTE). Devuelve **ventas de hoy**, **órdenes de compra
  pendientes**, **cuentas por pagar abiertas**, **utilidad e IVA del mes** y **stock bajo el mínimo
  + lotes por vencer** (≤ 30 días, solo lectura). Test `dashboard-gerencial.service.test.js`.
- **Frontend:** `Dashboard.jsx` ahora es **consciente del rol**: el GERENTE ve el dashboard
  gerencial (KPIs + stock); el CONTADOR conserva su panel fiscal (utilidad, IVA, cierre, estado del
  sistema).
- **Nota:** el recuadro de stock es una **vista de solo lectura**, no el sistema de alertas
  automáticas (RF-INV-03), que sigue fuera de alcance por decisión del cliente.
