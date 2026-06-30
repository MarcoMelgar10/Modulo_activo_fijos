# Progreso del Desarrollo — Módulo de Contabilidad (Flowy ERP)

> Documento de avance para el equipo. Se actualiza al cerrar cada etapa del plan.

**Última actualización:** 2026-06-22
**Etapa actual:** ✅ Etapas 0–3 completadas (verificadas end-to-end) → ⏭️ siguiente: Etapa 4
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
| 8 | Dashboard + cumplimiento fiscal SIN | ⬜ Pendiente |
| 9 | Pruebas, calidad y despliegue | ⬜ Pendiente |
| 10 | **Presupuesto**: definición y aprobación (RF-PRE-01/02) | ⬜ Pendiente |
| 11 | **Presupuesto**: ejecución y reportes (RF-PRE-03/04/05) | ⬜ Pendiente |

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

### Para continuar (siguiente quien retome)
1. `cd backend && npm install && npm run db:migrate && npm run db:seed` (crea/seedea la BD,
   incluida la tabla `cierre_contable`).
2. `npm test` para verificar (57 pruebas backend).
3. **Siguiente parte a desarrollar: Etapa 8 — Dashboard + cumplimiento fiscal (SIN).**
   Después: calidad/despliegue (9) y los módulos de Presupuesto (10–11).

> UI del módulo de Contabilidad COMPLETA hasta la Etapa 7: Login, Dashboard, Plan de
> cuentas, Asientos, Simulador ERP, Libro Diario, Libro Mayor, Balance General,
> Estado de Resultados y Cierre de gestión.
