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
| 4 | Generación automática (API de eventos) | ✅ Completada y verificada |
| 5 | Libros contables (Diario/Mayor) | ✅ Completada y verificada |
| 6 | Estados financieros | ✅ Completada y verificada |
| 7 | Cierre de gestión | ✅ Completada y verificada |
| 8 | Dashboard + cumplimiento fiscal SIN | ✅ Completada y verificada |
| 9 | Pruebas, calidad y despliegue | ✅ Completada y verificada |
| 10 | Presupuesto: definición y aprobación (RF-PRE-01/02) | ⬜ |
| 11 | Presupuesto: ejecución y reportes (RF-PRE-03/04/05) | ⬜ |

> **Alcance ampliado:** el proyecto incluye un segundo módulo, **Presupuesto** (Etapas 10–11,
> "Fase B" en el plan), que reutiliza la arquitectura y la contabilidad (la ejecución real se
> calcula desde `linea_asiento`). Requisitos en `documentacion.md` §3.5.7 y diccionario §3.6.5.
> Tablas nuevas: `presupuesto`, `linea_presupuesto`. Se construye después de las Etapas 0–9.

Ver el detalle de cada etapa completada en `PROGRESO.md`.

**Verificación al día de hoy:** backend 69/69 tests, frontend 3/3, lint limpio en ambos, build
frontend OK, Docker builds OK.

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

---

## Actualización 2026-07-01 — Etapas 8 y 9

- **Pruebas:** backend **69/69** · frontend 3/3.
- **Etapas completadas:** 0–9. Detalle completo en `PROGRESO.md`.
- **Siguiente:** Etapa 10 — Presupuesto (RF-PRE-01/02).

### Estado por capa
- **Backend:** etapas 0–9 completas (auth, plan de cuentas, asientos, generación automática,
  libros, estados financieros, cierre de gestión, **dashboard fiscal**, **libros fiscales**).
- **Frontend:** completas Login, Dashboard (KPIs fiscales), Plan de cuentas, Asientos,
  Simulador ERP, Libro Diario, Libro Mayor, Balance General, Estado de Resultados,
  Cierres, **Libro de Compras**, **Libro de Ventas**.
- **Deploy:** Dockerfiles multi-stage con health checks, CI/CD con Docker build job, DEPLOY.md.

### Endpoints nuevos (Etapa 8)
- `GET /api/dashboard?gestion=2026&mes=6` — KPIs: utilidad, IVA débito/crédito/neto, estado cierre.
- `GET /api/libros-fiscales/compras?mes=6&gestion=2026` — Libro de Compras con IVA desglosado.
- `GET /api/libros-fiscales/ventas?mes=6&gestion=2026` — Libro de Ventas con IVA desglosado.

### Receta para una nueva etapa (recordatorio)
Backend: `model` → `migration` → `repository` → `service` → `validator` → `controller` →
`route` (registrar en `routes/index.js`) → `test`. Frontend: `service` → `query` → `page`
(conectar en `router/AppRouter.jsx`). Tras terminar, **actualizar este archivo y `PROGRESO.md`**.

### Aviso importante para el equipo
- Tras **cerrar una gestión** (Etapa 7) no se pueden crear/editar asientos de ese año
  (bloqueo de período). Tenerlo en cuenta al hacer demos o pruebas con datos de un año cerrado.
- **No volver a versionar `backend/.env`**: usar `backend/.env.template` y crear el `.env` local.

---

## Actualización 2026-07-03 — Módulo Compras y Proveedores (RF-COM)

Se implementó el **módulo de Compras** del ERP de forma **real** (no simulada) y con integración
contable, además de la **base mínima de inventario** que las compras necesitan. También se
**corrigió el bug del Simulador ERP** (payload desalineado con la API → 400).

### Qué se construyó
- **Proveedores (RF-COM-01):** CRUD completo, NIT único, baja lógica.
- **Productos/Categorías/Lotes (RF-INV-01 parcial):** CRUD de productos y categorías; los lotes
  se crean automáticamente en la recepción de mercancía.
- **Órdenes de compra (RF-COM-02/03):** ciclo BORRADOR → ENVIADA → RECIBIDA → (CANCELADA).
  La **recepción** crea lotes + genera el asiento contable (contado contra Caja, o crédito contra
  Cuentas por Pagar) + registra la cuenta por pagar si aplica.
- **Cuentas por pagar (RF-COM-04):** pagos parciales/totales; **cada pago genera su asiento**
  (Cuentas por Pagar / Caja), por lo que aparece en Diario, Mayor y Balance.

### Modelo de datos (tablas nuevas)
`proveedor`, `categoria`, `producto`, `lote`, `orden_compra`, `detalle_orden_compra`,
`cuenta_por_pagar`, `pago_proveedor`.

### Endpoints nuevos
`/api/proveedores`, `/api/productos` (+ `/categorias`), `/api/ordenes-compra`
(`/enviar`, `/recibir`, `/cancelar`), `/api/cuentas-por-pagar` (+ `/:id/pagos`).
Detalle completo en `backend/README.md`. Los operan **GERENTE y CONTADOR**.

### Frontend
Nuevas secciones de sidebar **Compras** e **Inventario** con las páginas Proveedores, Productos,
Órdenes de compra y Cuentas por pagar (design system reutilizado).

### Cómo ponerlo en marcha
```bash
cd backend && npm run db:migrate && npm run db:seed && npm test
cd ../frontend && npm run lint && npm test && npm run build
```

### Pendiente del informe (para quien siga)
El documento oficial aún tiene sin construir: **Ventas/POS (RF-VEN)**, **inventario completo**
(FEFO, alertas RF-INV-03, biométrico RF-INV-04, traspasos RF-INV-05), **gestión de usuarios**
(RF-USR-00/02/04/05), **Flujo de Caja** y **exportación PDF/Excel** (RF-CON-03/RF-REP-02).

---

## Actualización 2026-07-03 (2) — Módulo Ventas y POS (RF-VEN)

Se implementó el **Punto de Venta** con integración contable completa.

### Qué se construyó
- **RF-VEN-01 Registro de ventas:** POS con carrito, método de pago y descuento; numeración
  `VTA-AAAA-#####`; asiento automático (Caja/Bancos · Ventas · IVA).
- **RF-VEN-02 Descuento de inventario (FEFO):** cada venta descuenta stock de los lotes con
  vencimiento más próximo primero (puede tomar de varios lotes).
- **RF-VEN-03 Devoluciones:** repone stock y genera el asiento de reversa; la venta pasa a
  DEVOLUCION_PARCIAL.
- **RF-VEN-04 Reporte de ventas:** totales + comparativa por sucursal con filtros
  (`GET /api/ventas/reporte`).

### Tablas nuevas
`venta`, `detalle_venta`, `devolucion`, `detalle_devolucion`.

### Endpoints
`/api/ventas` (listar/crear/detalle), `/api/ventas/reporte`, `/api/ventas/devoluciones`.
Los operan CONTADOR/GERENTE (CAJERO habilitado en backend para el futuro login de cajeros).

### Frontend
Nueva sección de sidebar **Ventas**: Punto de venta, Historial de ventas (con devolución) y
Reporte de ventas.

### Decisiones del cliente
- POS operado por Contador/Gerente (registra al usuario como cajero).
- Sin asiento de costo de ventas (solo baja el stock físico, no el inventario contable).
- Efectivo→Caja; tarjeta/QR→Bancos.

### Pendiente del informe (actualizado)
**Gestión de usuarios** (RF-USR-00/02/04/05), **inventario completo** (alertas RF-INV-03,
biométrico RF-INV-04, traspasos RF-INV-05), **Flujo de Caja** (RF-CON-03) y **exportación
PDF/Excel con logo** (RF-REP-02).

---

## Actualización 2026-07-03 (3) — Gestión de usuarios y RBAC por rol (RF-USR)

El **GERENTE** (administrador) crea usuarios y les asigna un rol; el rol define a qué módulos
accede cada uno. Los roles siguen viniendo del **seeder**.

### Acceso por rol (mapeo por especialidad)
- **GERENTE** → todo + gestión de usuarios.
- **CONTADOR** → Contabilidad y Reportes Financieros.
- **CAJERO** → Ventas/POS (+ lectura del catálogo para vender).
- **BODEGUERO** → Inventario y Compras.

El control se aplica en **dos capas**: backend (`authorizeRoles` en cada ruta) y frontend
(`lib/access.js` + `navItems.roles`, `Sidebar` filtra, `AppRouter` protege cada ruta y `RoleHome`
lleva a cada rol a su módulo). Solo el GERENTE ve la sección **Administración → Usuarios**.

### Backend
- Módulo `usuarios`: repository/service/validators/controller/routes (solo GERENTE). Alta con
  hash bcrypt, edición, alta/baja lógica, listado de roles. Endpoints en `/api/usuarios`.
- Ajuste de RBAC en las rutas de Ventas (CAJERO), Compras/Inventario (BODEGUERO) y Contabilidad
  (CONTADOR). Productos legible por CAJERO (para el POS).

### Usuarios demo (seeder)
`gerente`/`Gerente123`, `contador`/`Contador123`, `cajero`/`Cajero123`, `bodeguero`/`Bodeguero123`.

### Fuera de alcance (confirmado con el cliente)
- **Multi-sucursal (RF-USR-05):** stand-by; usuarios nuevos usan la sucursal 1.
- **Registro de sesiones (RF-USR-03):** sin cambios.
- **Auto-registro público (RF-USR-00):** no se implementa; el alta la hace el GERENTE.

### Pendiente del informe (actualizado)
**Inventario avanzado** (alertas RF-INV-03, biométrico RF-INV-04, traspasos RF-INV-05),
**Flujo de Caja** (RF-CON-03), **exportación PDF/Excel con logo** (RF-REP-02), **multi-sucursal**
y **auto-registro** (si se decidiera incluirlo).

---

## Actualización 2026-07-03 (4) — Export PDF, Auditoría y Flujo de Caja

### Export a PDF (RF-REP-02, parte PDF)
- `frontend/src/lib/pdf.js` (jsPDF + jspdf-autotable, import dinámico). Botón **Exportar PDF** en
  Balance General, Estado de Resultados, Libro Diario/Mayor, Libro de Compras/Ventas, Reporte de
  Ventas y Flujo de Caja. **Requiere `cd frontend && npm install`** (se añadieron `jspdf` y
  `jspdf-autotable`).
- De paso se corrigió un bug: Balance General y Estado de Resultados leían claves inexistentes en la
  respuesta (`data.activo/…`); ahora consumen `data.cuentas` (planas por tipo) y muestran datos.

### Auditoría de acciones (RF-REP-03)
- Backend `/api/auditoria` (solo GERENTE) que lee el log inmutable con filtros por fecha/módulo/usuario.
- Frontend: página **Auditoría** en la sección Administración (solo GERENTE), con export PDF.

### Flujo de Caja (RF-CON-03)
- Backend `/api/reportes/flujo-caja`: método directo sobre Caja (1.1.1) y Bancos (1.1.2), con saldo
  inicial, entradas/salidas por origen y saldo final.
- Frontend: página **Flujo de Caja** en Reportes Financieros, con export PDF.

### Pendiente del informe (actualizado)
**Inventario avanzado** (RF-INV-03/04/05), **exportación a Excel** (el PDF ya está; falta Excel y el
logo como imagen), **multi-sucursal** (RF-USR-05, en stand-by) y **auto-registro** (RF-USR-00, si se
decidiera incluirlo).

---

## Actualización 2026-07-03 (5) — Módulo Presupuesto (RF-PRE)

Presupuesto **anual por gestión** de Ingresos y Gastos, apoyado en la contabilidad.

### Flujo
- **Definición (RF-PRE-01):** el CONTADOR crea un presupuesto (BORRADOR) con líneas por cuenta hoja
  de INGRESO/GASTO y su monto planificado.
- **Aprobación (RF-PRE-02):** el GERENTE aprueba o rechaza (no se aprueban dos para la misma gestión).
- **Ejecución (RF-PRE-03/04/05):** compara planificado vs real (movimientos contables de la gestión),
  con desviación, % de ejecución y alertas (sobregiro en gastos, bajo meta en ingresos).

### Backend
- Modelos `Presupuesto`/`LineaPresupuesto`; `/api/presupuestos` (CONTADOR/GERENTE; aprobar/rechazar
  solo GERENTE); la ejecución reutiliza `reporteRepository.getTotalesPorCuenta`. Test del service.

### Frontend
- Sección **Presupuesto** (CONTADOR/GERENTE): páginas Presupuestos (definición + aprobación) y
  Ejecución presupuestaria (plan vs real con export PDF).

### Tablas nuevas
`presupuesto`, `linea_presupuesto`.

### Nota de alcance
RF-PRE no está en `Ingenieria de software.md`; se construyó según los documentos internos y prácticas
estándar, con las decisiones confirmadas por el cliente (Ingresos+Gastos, anual, contador define /
gerente aprueba).

### Pendiente del informe (actualizado)
Solo restan del informe: **inventario avanzado** (RF-INV-03/04/05), **export a Excel** (el PDF ya
está), **dashboard gerencial ampliado** (RF-REP-01) y, fuera del alcance activo por decisión del
cliente, **multi-sucursal** (RF-USR-05) y **auto-registro** (RF-USR-00).

---

## Actualización 2026-07-03 (6) — Dashboard gerencial (RF-REP-01)

Panel de KPIs en tiempo real para el GERENTE.

- **Backend:** `GET /api/dashboard/gerencial` (solo GERENTE) — `dashboard-gerencial.service.js`
  compone ventas/compras/CxP/inventario + resumen financiero del mes. Devuelve ventas de hoy,
  órdenes pendientes, cuentas por pagar abiertas, utilidad e IVA del mes, y **stock bajo el mínimo +
  lotes por vencer** (solo lectura).
- **Frontend:** `Dashboard.jsx` es consciente del rol: GERENTE → dashboard gerencial; CONTADOR →
  panel fiscal previo.
- El recuadro de stock es solo lectura (no es el sistema de alertas automáticas RF-INV-03).

### Pendiente del informe (actualizado)
Del informe solo restan: **inventario avanzado** (RF-INV-03/04/05) y **export a Excel** (el PDF ya
está); fuera del alcance activo por decisión del cliente: **multi-sucursal** (RF-USR-05) y
**auto-registro** (RF-USR-00).
