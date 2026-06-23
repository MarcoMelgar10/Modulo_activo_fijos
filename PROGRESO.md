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
| 4 | Generación automática (API de eventos) | ⬜ Pendiente |
| 5 | Libros contables (Diario/Mayor) | ⬜ Pendiente |
| 6 | Estados financieros | ⬜ Pendiente |
| 7 | Cierre de gestión | ⬜ Pendiente |
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
