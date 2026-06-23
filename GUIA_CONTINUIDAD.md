# Guía de Continuidad del Proyecto — Módulo de Contabilidad (Flowy ERP)

> **Para quien retoma el proyecto (humano o Claude en otra máquina).**
> Este documento explica QUÉ es la aplicación, CÓMO está construida, EN QUÉ etapa está y
> CÓMO seguir, con el detalle suficiente para continuar sin contexto previo.
> Documentos hermanos: [PROGRESO.md](PROGRESO.md) (bitácora por etapa) ·
> [README.md](README.md) (resumen) · [backend/README.md](backend/README.md) (endpoints) ·
> [documentacion.md](documentacion.md) (requisitos originales del proyecto académico).

---

## 1. Qué es la aplicación

Es el **módulo de Contabilidad y Finanzas** de un ERP web llamado **Flowy**, diseñado para la
cadena de supermercados ficticia **MarketSuper** (proyecto de la materia Ingeniería de Software).

El ERP completo (descrito en `documentacion.md`) tiene módulos de inventario, ventas POS,
compras, contabilidad y seguridad. **Este repositorio implementa el módulo de Contabilidad y,
como complemento, el módulo de Presupuesto** (control presupuestario que se apoya en la
contabilidad — ver Etapas 10–11). Los demás módulos del ERP quedan fuera de alcance.

### ⚠️ Aclaración de nombre (importante)
La carpeta se llama `Modulo_activo_fijos`, pero **el módulo NO es de activos fijos**. Es de
**Contabilidad**. El nombre es un remanente. La evidencia: el diagrama de clases (punto 3.7.4/5
de la doc), el diccionario de datos §3.6.4 y los requisitos RF-CON-01..05 son todos contables.
"Activos Fijos" solo aparece en §1.7 como los activos de la empresa desarrolladora, no como
módulo del sistema.

### Qué hace el módulo (requisitos RF-CON)
- **RF-CON-01:** generar asientos contables automáticamente desde eventos (venta, compra,
  devolución, pago) y permitir asientos manuales.
- **RF-CON-02:** Libro Diario y Libro Mayor por rango de fechas (exportables).
- **RF-CON-03:** estados financieros: Balance General, Estado de Resultados, Flujo de Caja.
- **RF-CON-04:** plan de cuentas según normativa boliviana y reportes para el SIN.
- **RF-CON-05:** cierre de gestión mensual/anual con bloqueo de período y asiento de apertura.

---

## 2. Stack tecnológico (definido por la doc, punto 3.7.5)

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18 (Vite), Tailwind CSS 3, Axios + React Query, React Router v6, Jest + Testing Library |
| **Backend** | Node.js 20 (ESM), Express 4, Sequelize ORM, JWT + bcrypt, Winston, Jest + Supertest, Zod |
| **Datos** | MySQL 8, Redis 7 (caché + sesiones JWT) |
| **DevOps** | Docker + Compose, GitHub Actions, ESLint + Prettier, GitFlow |

**Lenguaje: JavaScript ES2022 (ESM), NO TypeScript.** Es una decisión explícita del cliente:
seguir estrictamente la doc de esta app e **ignorar** cualquier otro proyecto de referencia
(p. ej. `Portal-de-Clientes`). No introducir TypeScript.

---

## 3. Arquitectura

### Principio: capas (RNF-07 → Presentación / Negocio / Datos)
Cada recurso del backend atraviesa estas capas, **en este orden**:

```
routes  →  controller  →  service  →  repository  →  model (Sequelize)
(HTTP)     (HTTP↔app)     (negocio)   (datos)        (tabla)
```

- **routes/**: define endpoints + middlewares (auth, RBAC, validación).
- **controllers/**: traducen request/response. **Sin lógica de negocio.**
- **services/**: TODA la lógica de negocio (partida doble, cierre, reglas de cuentas, auth).
  Se crean con **inyección de dependencias** (factory `createXxxService({ repo, ... })`) para
  poder testear con mocks sin tocar la BD. Se exporta también una instancia por defecto.
- **repositories/**: acceso a datos. Aíslan Sequelize del resto (DIP).
- **models/**: entidades Sequelize y asociaciones (`models/index.js` centraliza relaciones).

### Principios SOLID aplicados
- **SRP:** una responsabilidad por capa/archivo.
- **DIP:** services dependen de abstracciones inyectadas, no del ORM directo.
- **OCP:** la generación de asientos (Etapa 4) usará **estrategias por tipo de evento**,
  extensibles sin modificar el núcleo.
- **DRY:** un único design system (`frontend/src/components/ui`), un único cliente Axios, un
  único manejador de errores (`errorHandler` + clase `ApiError`).

### Manejo de errores (backend)
- Lanzar `ApiError.badRequest/unauthorized/forbidden/notFound/conflict(...)` desde services.
- Envolver handlers async con `asyncHandler(...)`.
- `errorHandler` traduce `ApiError` y errores de Sequelize a JSON consistente.

### Frontend
- **Design system** en `components/ui` (Button, Card, Input, Select, Modal, Badge, Spinner,
  EmptyState, PageHeader). **Toda página los reutiliza** (uniformidad). Estética minimalista:
  paleta neutra + un acento sobrio, fuente Inter, sin degradados ni emojis.
- **React Query** para datos del servidor (hooks en `queries/`), **Axios** único en
  `services/api.js` (inyecta el `Authorization: Bearer` desde `AuthContext`).
- **Rutas protegidas** con `ProtectedRoute` (exige sesión y rol). Roles con acceso al módulo:
  `CONTADOR` y `GERENTE`. Escritura contable: solo `CONTADOR`.

---

## 4. Estructura del repositorio

```
Modulo_activo_fijos/
├── docker-compose.yml          # mysql 8 + redis 7 + backend + frontend
├── .github/workflows/ci.yml    # CI: lint+test (backend) · lint+test+build (frontend)
├── README.md · PROGRESO.md · GUIA_CONTINUIDAD.md · documentacion.md
├── backend/
│   ├── src/
│   │   ├── config/        env.js · logger.js · database.js · redis.js
│   │   ├── models/        index.js (asociaciones) · Rol · Sucursal · Empleado ·
│   │   │                  LogAuditoria · CuentaContable
│   │   ├── repositories/  empleado.repository.js · cuenta.repository.js
│   │   ├── services/      auth.service.js · token.service.js · audit.service.js ·
│   │   │                  cuenta.service.js
│   │   ├── controllers/   health · auth · cuenta
│   │   ├── routes/        index.js (agregador /api) · health · auth.routes · cuenta.routes
│   │   ├── middleware/    requireAuth · authorizeRoles · validate · errorHandler · notFound
│   │   ├── validators/    auth.validators.js · cuenta.validators.js (Zod)
│   │   ├── utils/         ApiError.js · asyncHandler.js
│   │   ├── app.js         ensamblado Express
│   │   └── server.js      arranque (conecta MySQL/Redis y levanta)
│   ├── database/
│   │   ├── config.cjs     config sequelize-cli (seederStorage: sequelize)
│   │   ├── migrations/    *-auth.cjs · *-cuenta-contable.cjs
│   │   └── seeders/       *-auth-demo.cjs · *-plan-cuentas.cjs
│   ├── tests/             app.test · auth.service.test · cuenta.service.test
│   ├── .sequelizerc · eslint.config.js · jest.config.js · Dockerfile · .env.template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/ui/      design system (8 componentes)
    │   ├── components/layout/  AppShell · Sidebar · Topbar · navItems
    │   ├── pages/              Login · Dashboard · Cuentas · Placeholder
    │   ├── queries/            queryClient.js · useCuentas.js
    │   ├── services/           api.js · auth.service.js · cuentas.service.js
    │   ├── store/              AuthContext.jsx
    │   ├── router/             AppRouter.jsx · ProtectedRoute.jsx
    │   ├── lib/                cn.js
    │   ├── index.css · main.jsx · App.jsx
    ├── tailwind.config.js · vite.config.js · eslint.config.js · jest.config.cjs ·
    │   babel.config.cjs · jest.setup.js · Dockerfile · nginx.conf
    └── package.json
```

---

## 5. Modelo de datos (tablas creadas / por crear)

**Creadas (Etapas 1–2):**
- `rol`, `sucursal`, `empleado`, `log_auditoria` — seguridad y auditoría.
- `cuenta_contable` — plan de cuentas (auto-relación `id_cuenta_padre`, `tipo`, `nivel`,
  `permite_movimiento`).

**Por crear (Etapas 3, 4, 7):**
- `asiento_contable` — cabecera (numero_asiento, fecha, concepto, tipo_origen, id_referencia,
  estado BORRADOR/CONFIRMADO/ANULADO, id_sucursal).
- `linea_asiento` — detalle (id_asiento, id_cuenta hoja, debe, haber).
- `cierre_contable` — período (periodo_mes, periodo_anio, estado ABIERTO/CERRADO, totales).

Las definiciones exactas de columnas están en `documentacion.md` §3.6.4.

---

## 6. Estado actual del desarrollo

| Etapa | Descripción | Estado |
|-------|-------------|--------|
| 0 | Fundaciones / Scaffolding | ✅ Completada y verificada |
| 1 | Auth, RBAC y Auditoría | ✅ Completada y verificada |
| 2 | Plan de Cuentas | ✅ Completada y verificada |
| 3 | Asientos manuales (partida doble) | ✅ Completada y verificada |
| 4 | **Generación automática (API de eventos)** | ⏳ **SIGUIENTE** |
| 5 | Libros contables (Diario/Mayor) | ⬜ |
| 6 | Estados financieros | ⬜ |
| 7 | Cierre de gestión | ⬜ |
| 8 | Dashboard + cumplimiento fiscal SIN | ⬜ |
| 9 | Pruebas, calidad y despliegue | ⬜ |
| 10 | Presupuesto: definición y aprobación (RF-PRE-01/02) | ⬜ |
| 11 | Presupuesto: ejecución y reportes (RF-PRE-03/04/05) | ⬜ |

> **Alcance ampliado:** el proyecto incluye un segundo módulo, **Presupuesto** (Etapas 10–11,
> "Fase B" en el plan), que reutiliza la arquitectura y la contabilidad (la ejecución real se
> calcula desde `linea_asiento`). Requisitos en `documentacion.md` §3.5.7 y diccionario §3.6.5.
> Tablas nuevas: `presupuesto`, `linea_presupuesto`. Se construye después de las Etapas 0–9.

Ver el detalle de cada etapa completada en `PROGRESO.md`.

**Verificación al día de hoy:** backend 10/10 tests, frontend 3/3, lint limpio en ambos, build
frontend OK, y flujo real probado contra MySQL+Redis (login, /me, logout con revocación,
auditoría, plan de cuentas con árbol y RBAC).

---

## 7. Cómo levantar el entorno (paso a paso)

> Requisitos: Node 20+, Docker Desktop.

```bash
# 1. Infraestructura (desde la raíz del repo)
docker compose up -d mysql redis        # espera a que mysql quede "healthy"

# 2. Backend
cd backend
cp .env.template .env                    # ya existe un .env local válido para dev
npm install
npm run db:migrate                       # crea tablas
npm run db:seed                          # datos demo (idempotente: seederStorage=sequelize)
npm run dev                              # http://localhost:4000  ·  /health

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev                              # http://localhost:5173 (proxy /api → :4000)
```

**Usuarios demo:** `contador` / `Contador123` (rol CONTADOR) · `gerente` / `Gerente123` (GERENTE).

**Todo el entorno con un comando** (build de imágenes): `docker compose up --build`
(frontend en `http://localhost:8080`).

---

## 8. Cómo verificar (lo que debe pasar)

```bash
# Backend
cd backend && npm run lint && npm test          # lint limpio + 10/10
# Frontend
cd frontend && npm run lint && npm test && npm run build   # lint + 3/3 + build OK

# Humo end-to-end (con backend corriendo):
curl http://localhost:4000/health               # status ok, database ok, redis ok
# login → guardar token → GET /api/cuentas/arbol → ver 5 raíces
```

---

## 9. Receta para añadir un recurso nuevo (patrón a seguir)

Para mantener uniformidad, cada recurso contable nuevo se construye así:

**Backend**
1. `models/Xxx.js` — define el modelo Sequelize; registra asociaciones en `models/index.js`.
2. `database/migrations/<fecha>-xxx.cjs` — crea la tabla (FKs, índices). Ejecutar `db:migrate`.
3. (opcional) `database/seeders/<fecha>-xxx.cjs` — datos demo.
4. `repositories/xxx.repository.js` — métodos de acceso a datos.
5. `services/xxx.service.js` — `createXxxService({ repo })` con la lógica + instancia por defecto.
6. `validators/xxx.validators.js` — esquemas Zod.
7. `controllers/xxx.controller.js` — usa `asyncHandler`, llama al service, audita acciones.
8. `routes/xxx.routes.js` — `requireAuth` + `authorizeRoles(...)` + `validateBody(...)`.
9. Registrar en `routes/index.js` (`router.use('/xxx', xxxRoutes)`).
10. `tests/xxx.service.test.js` — pruebas unitarias del service con mocks.

**Frontend**
1. `services/xxx.service.js` — llamadas Axios.
2. `queries/useXxx.js` — hooks React Query (query + mutations con `invalidateQueries`).
3. `pages/Xxx.jsx` — UI con componentes de `components/ui`.
4. Conectar en `router/AppRouter.jsx` (reemplazar el `Placeholder`).
5. (si falta) añadir componentes reutilizables a `components/ui` y exportarlos en `index.js`.

**Documentación (obligatorio al cerrar etapa)**
- Actualizar `PROGRESO.md` (estado, entregado, verificación, próxima etapa).
- Actualizar la tabla de endpoints en `backend/README.md`.

---

## 10. Próximo paso concreto: Etapa 4 — Generación automática

**Objetivo:** generar asientos automáticamente desde eventos de otros módulos (RF-CON-01 completo).
Ventas/Compras están fuera de alcance, por eso se usa una **capa anticorrupción**: un endpoint
entrante que recibe el evento y lo traduce a un asiento, **reutilizando `asientoService.crear`**.

**Backend a construir:**
- `services/accounting.service.js` (`AccountingService`) con **estrategias por tipo de evento**
  (patrón OCP): `VENTA`, `COMPRA`, `DEVOLUCION`, `PAGO`. Cada estrategia mapea el payload del
  evento a líneas de asiento usando códigos de cuenta del plan (buscar por `codigo`, no por id):
  - VENTA: Debe Caja/Cuentas por Cobrar (1.1.1/1.1.3) · Haber Ventas (4.1.1) + IVA Débito (2.1.2).
  - COMPRA: Debe Inventario (1.1.4) + IVA Crédito (1.1.5) · Haber Caja/Cuentas por Pagar.
  - DEVOLUCION: inverso de la venta. · PAGO: Debe Cuentas por Pagar · Haber Caja/Bancos.
  - Cada estrategia fija `tipo_origen` y `id_referencia` (id del documento origen) para trazabilidad.
- `validators/evento.validators.js` (Zod): `{ tipo, fecha, referencia_id, montos... }`.
- `controllers/evento.controller.js` + `routes/evento.routes.js` → `POST /api/eventos-contables`.
  Registrar en `routes/index.js`. Idealmente el asiento generado se confirma automáticamente.
- `database/seeders/...-eventos-demo.cjs`: invoca el AccountingService (o inserta asientos)
  para demostrar VENTA/COMPRA/DEVOLUCION/PAGO con asientos reales.
- Tests del AccountingService (cada estrategia produce líneas balanceadas correctas).

**Frontend (opcional en esta etapa):** los asientos automáticos ya se ven en la página de
Asientos (filtrables por `tipo_origen`). Se puede añadir un filtro por origen.

**Buscar cuentas por código:** añadir helper en `cuentaRepository` o usar `findByCodigo` ya
existente; mapear los códigos del seeder del plan (sección §5 / seeder de Etapa 2).

Las etapas 5–9 están descritas en el plan aprobado y en `PROGRESO.md`.

---

## 11. Convenciones y "gotchas" ya resueltos
- **ESM en todo el backend** (`"type": "module"`). Sequelize CLI usa archivos `.cjs`
  (migraciones, seeders, `database/config.cjs`) porque la CLI es CommonJS.
- **Jest backend** corre con `node --experimental-vm-modules` (ya configurado en el script).
- **Jest frontend** usa Babel solo para tests (`babel.config.cjs`); Vite usa esbuild aparte.
- **ESLint 9 (flat config).** En frontend, `eslint-plugin-react-hooks` debe ser **v5**
  (la v4 no soporta ESLint 9).
- **Seeders idempotentes:** `seederStorage: 'sequelize'` en `database/config.cjs`.
- **bcrypt** compila nativo; si falla en una máquina, reinstalar o considerar `bcryptjs`.
- **Build de Vite en Windows:** si el primer `npm run build` falla con error nativo de Rollup
  (`ERR_DLOPEN_FAILED`), reintentar (npm a veces no instala el binario opcional al primer intento).
- **No exponer `password_hash`:** el modelo `Empleado` lo elimina en `toJSON()`.
- **Seguridad:** JWT en `Authorization: Bearer`; sesión en Redis por `jti` (permite logout);
  bloqueo tras 5 intentos; rate-limit en `/login`; auditoría en `log_auditoria`.

---

## 12. Flujo de trabajo recomendado para continuar
1. Levantar entorno (sección 7) y correr verificación (sección 8) para confirmar base sana.
2. Implementar la etapa siguiente con la receta (sección 9) y el detalle (sección 10).
3. Verificar end-to-end contra MySQL/Redis reales.
4. Actualizar `PROGRESO.md` y `backend/README.md`.
5. Repetir con la siguiente etapa.
