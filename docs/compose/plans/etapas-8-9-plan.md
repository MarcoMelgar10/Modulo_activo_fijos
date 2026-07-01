# Plan — Etapas 8 y 9: Dashboard Fiscal SIN + Preparación de Despliegue

> **Contexto:** Módulo de Contabilidad (Flowy ERP). Etapas 0–7 completas.
> Backend: 57 tests · Frontend: 3 tests (Login, Button).
> Stack: Node 20 + Express + Sequelize + MySQL 8 + Redis 7 / React 18 + Vite + Tailwind.
>
> **Seeders existentes:** el seeder `20260627000001-eventos-demo.cjs` ya genera 4 asientos
> CONFIRMADOS (VENTA $1000, COMPRA $5000, DEVOLUCION $200, PAGO $3000) — hay datos para el
> dashboard y los libros fiscales.

---

## Etapa 8 — Dashboard + Cumplimiento Fiscal SIN

### Objetivo
Dashboard ejecutivo con KPIs contables/fiscales y Libro de Compras/Ventas (requerimiento real del SIN boliviano). Los formularios exportables (110, 610, 510) quedan como extensión futura.

### Principio de diseño: componer, no duplicar

Los datos del dashboard se obtienen **componiendo servicios existentes**, no creando repositorios paralelos. Esto sigue el patrón DIP ya establecido (el `cierreService` ya compone `reporteRepository` + `cuentaRepository`).

---

### 8.1 — Backend: Dashboard Service

**Archivo nuevo:** `backend/src/services/dashboard.service.js`

El servicio compone:
- `reporteService.generarEstadoResultados()` → utilidad del ejercicio
- `reporteRepository.getTotalesPorCuenta()` → IVA débito/crédito del mes
- `cierreRepository.findByPeriodo()` → estado del cierre
- `asientoRepository.findAll()` → conteo de asientos (ya existe)

**Endpoint:**

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/dashboard?gestion=2026&mes=6` | KPIs consolidados del período |

**Implementación:**

```js
// backend/src/services/dashboard.service.js
export function createDashboardService({
  reporteService = defaultReporteService,
  reporteRepo = defaultReporteRepo,
  cierreRepo = defaultCierreRepo,
  asientoRepo = defaultAsientoRepo,
} = {}) {
  return {
    async obtenerKPIs({ gestion, mes }) {
      // 1. Utilidad del ejercicio (reutiliza reporteService)
      const estadoResultados = await reporteService.generarEstadoResultados({
        fecha_inicio: `${gestion}-01-01`,
        fecha_fin: `${gestion}-12-31`,
      });

      // 2. IVA del mes (query directa al reporteRepo, filtrando por tipo_origen)
      //    - IVA Débito: líneas de cuenta 2.1.2 (haber) en asientos VENTA
      //    - IVA Crédito: líneas de cuenta 1.1.5 (debe) en asientos COMPRA
      const ivaData = await reporteRepo.getIVAPorPeriodo({
        fecha_inicio: `${gestion}-${String(mes).padStart(2, '0')}-01`,
        fecha_fin: finDelMes(gestion, mes),
      });

      // 3. Estado del cierre
      const cierre = await cierreRepo.findByPeriodo({ anio: gestion });

      // 4. Conteo de asientos
      const asientos = await asientoRepo.findAll({});

      return {
        gestion,
        mes,
        utilidad_ejercicio: estadoResultados.resumen.utilidad_neta,
        iva_debito: ivaData.debito,
        iva_credito: ivaData.credito,
        iva_neto: ivaData.debito - ivaData.credito,
        cierre_estado: cierre ? 'CERRADO' : 'ABIERTO',
        total_asientos: asientos.length,
      };
    },
  };
}
```

**Nuevo método en `reporteRepository`:**

```js
// Agregar a backend/src/repositories/reporte.repository.js
async getIVAPorPeriodo({ fecha_inicio, fecha_fin }) {
  // Busca líneas de IVA en asientos CONFIRMADOS del período
  // Cuenta 2.1.2 (IVA Débito) → haber = débito fiscal
  // Cuenta 1.1.5 (IVA Crédito) → debe = crédito fiscal
  const rows = await LineaAsiento.findAll({
    attributes: [
      'id_cuenta',
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('debe')), 0), 'total_debe'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('haber')), 0), 'total_haber'],
    ],
    include: [{
      model: AsientoContable,
      as: 'asiento',
      where: {
        estado: 'CONFIRMADO',
        fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
      },
      attributes: [],
    }],
    where: { id_cuenta: { [Op.in]: [/* ids de cuentas 2.1.2 y 1.1.5 */] } },
    group: ['id_cuenta'],
    raw: true,
  });
  // Mapear: cuenta 2.1.2 → debito, cuenta 1.1.5 → credito
  return { debito: ..., credito: ... };
}
```

**Archivos nuevos:**
- `dashboard.service.js` — servicio (compone repos existentes)
- `dashboard.controller.js` — controller HTTP estándar
- `dashboard.routes.js` — `requireAuth` + `authorizeRoles('CONTADOR', 'GERENTE')`
- `validators/dashboard.validators.js` — Zod: `{ gestion: z.number(), mes: z.number().optional() }`
- Registrar en `routes/index.js`: `router.use('/dashboard', dashboardRoutes)`

**Tests:** `tests/dashboard.service.test.js`
- Mockear `reporteService`, `reporteRepo`, `cierreRepo`, `asientoRepo`
- Verificar: utilidad se obtiene de `reporteService`, IVA se calcula correctamente, estado de cierre se mapea

---

### 8.2 — Backend: Libro de Compras/Ventas

> **Nota:** esto NO es el Libro Diario filtrado. El Libro Diario tiene **una fila por línea de asiento**.
> El Libro de Compras/Ventas tiene **una fila por asiento** (cabecera) con el IVA desglosado.

**Archivos nuevos:**
- `backend/src/services/libro-fiscal.service.js`
- `backend/src/repositories/libro-fiscal.repository.js`
- `backend/src/controllers/libro-fiscal.controller.js`
- `backend/src/routes/libro-fiscal.routes.js`
- `backend/src/validators/libro-fiscal.validators.js`

**Endpoints:**

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/libros-fiscales/compras?mes=6&gestion=2026` | Libro de Compras |
| `GET /api/libros-fiscales/ventas?mes=6&gestion=2026` | Libro de Ventas |

**Estructura de respuesta (Libro de Compras):**
```json
{
  "periodo": { "mes": 6, "gestion": 2026 },
  "registros": [
    {
      "fecha": "2026-06-15",
      "numero_asiento": "AST-2026-00002",
      "concepto": "Compra automática — Ref #501",
      "monto_neto": "4424.78",
      "iva_credito": "575.22",
      "monto_total": "5000.00"
    }
  ],
  "totales": {
    "total_neto": "...",
    "total_iva": "...",
    "total_general": "..."
  }
}
```

**Query del repositorio:**
```js
// libro-fiscal.repository.js
async getRegistros({ tipo_origen, fecha_inicio, fecha_fin }) {
  // Busca asientos CONFIRMADOS del tipo dado en el período
  // JOIN con linea_asiento para extraer el monto IVA
  // Para COMPRA: IVA = línea con cuenta 1.1.5, debe
  // Para VENTA: IVA = línea con cuenta 2.1.2, haber
  // Monto total = suma de debe (o haber) de todas las líneas del asiento
  // Monto neto = total - IVA
}
```

**Registrar en `routes/index.js`:** `router.use('/libros-fiscales', libroFiscalRoutes)`

**Tests:** `tests/libro-fiscal.service.test.js`
- Mockear el repo, verificar que neto + IVA = total
- Período sin registros → array vacío + totales en 0

---

### 8.3 — Frontend: Dashboard Fiscal

**Archivos a modificar/crear:**
- `frontend/src/pages/Dashboard.jsx` — mejorar el existente
- `frontend/src/services/dashboard.service.js` — llamada Axios
- `frontend/src/queries/useDashboard.js` — hook React Query

**Widgets (grid responsivo con componentes existentes):**

| Widget | Componente | Datos |
|--------|-----------|-------|
| Resumen gestión | `Card` × 3 | total asientos, utilidad ejercicio, estado cierre |
| IVA del mes | `Card` con `Badge` | débito, crédito, neto (verde si a favor, rojo si en contra) |
| Últimos asientos | tabla simple | 5 más recientes (número, fecha, concepto, importe, estado con `Badge`) |

**Implementación:**
- `useQuery({ queryKey: ['dashboard', gestion, mes], queryFn: ... })` con `staleTime: 30_000`
- Formateo: `toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })`
- Selector de mes/gestión en el header (dropdown simple)

---

### 8.4 — Frontend: Páginas Libro de Compras/Ventas

**Archivos nuevos:**
- `frontend/src/pages/LibroCompras.jsx`
- `frontend/src/pages/LibroVentas.jsx`
- `frontend/src/services/libros-fiscal.service.js`
- `frontend/src/queries/useLibrosFiscal.js`

**UI:**
- Selector de mes/gestión (dropdown)
- Tabla: fecha, número asiento, concepto, monto neto, IVA, total
- Fila de totales al pie
- Botón "Exportar CSV" (generar client-side con `Blob` + `URL.createObjectURL`)

**Router (`AppRouter.jsx`):** agregar rutas `/libro-compras` y `/libro-ventas`

**Sidebar (`navItems.js`):** agregar en la sección existente `'Reportes Financieros'`:
```js
{ to: '/libro-compras', label: 'Libro de Compras', section: 'Reportes Financieros' },
{ to: '/libro-ventas', label: 'Libro de Ventas', section: 'Reportes Financieros' },
```

---

### 8.5 — Tests

| Capa | Archivo | Qué verifica |
|------|---------|-------------|
| Backend | `tests/dashboard.service.test.js` | KPIs compuestos correctamente, IVA débito/crédito, utilidad de `reporteService`, estado cierre |
| Backend | `tests/libro-fiscal.service.test.js` | neto + IVA = total, período vacío → vacío, totales correctos |
| Frontend | `Dashboard.test.jsx` | Renderiza sin crash, muestra KPIs (mock de API) |
| Frontend | `LibroCompras.test.jsx` | Renderiza tabla, selector de período |

---

## Etapa 9 — Preparación para Despliegue (Deploy-Ready)

### Objetivo
Dejar el proyecto listo para desplegar en cualquier PaaS o VPS sin cambios. No se ejecuta deploy real.

### 9.1 — Dockerfiles de Producción

**Backend `backend/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY database/ ./database/
COPY package.json ./
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "src/server.js"]
```

**Frontend `frontend/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Verificar que `nginx.conf` incluye SPA fallback: `try_files $uri /index.html;`

### 9.2 — Variables de Entorno

**`backend/.env.template`** — agregar comentario de producción:
```bash
# ---- Producción ----
# NODE_ENV=production
# CORS_ORIGIN=https://tu-dominio.com
# JWT_SECRET=<generar con: openssl rand -hex 32>
```

**Frontend:** si el backend está en otro dominio, documentar `VITE_API_BASE_URL` en un comentario del `vite.config.js`.

### 9.3 — CI/CD Mejoras

**`.github/workflows/ci.yml`** — agregar job de verificación Docker:
```yaml
  docker:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      - name: Build backend image
        run: docker build -t contabilidad-backend ./backend
      - name: Build frontend image
        run: docker build -t contabilidad-frontend ./frontend
```

### 9.4 — Scripts de Producción

**`package.json` en raíz** (nuevo, solo conveniencia):
```json
{
  "name": "contabilidad-erp",
  "private": true,
  "scripts": {
    "dev": "docker compose up --build",
    "test": "cd backend && npm test && cd ../frontend && npm test",
    "lint": "cd backend && npm run lint && cd ../frontend && npm run lint"
  }
}
```

### 9.5 — Documentación de Despliegue

**`DEPLOY.md`** (nuevo) — guía concisa:
1. Requisitos: Docker 24+, MySQL 8, Redis 7
2. Variables de entorno obligatorias (referencia a `.env.template`)
3. Comandos: `docker compose up -d`
4. Migraciones: `docker compose exec backend npm run db:migrate && npm run db:seed`
5. Health check: `curl http://localhost:4000/health`
6. Usuarios demo y advertencia de cambiar JWT_SECRET en producción

### 9.6 — Seguridad Pre-Deploy (checklist)

- [x] `helmet()` configurado (app.js)
- [x] Rate-limit en `/login` (Etapa 1)
- [x] `password_hash` excluido en `toJSON()` del modelo Empleado
- [x] CORS configurable vía `CORS_ORIGIN`
- [ ] Verificar que `.env.template` NO tiene secrets reales
- [ ] Verificar que `JWT_SECRET` del template es un placeholder obvio

---

## Orden de Ejecución

```
Etapa 8 (backend primero):
  1. Agregar getIVAPorPeriodo() a reporte.repository.js
  2. Crear dashboard.service.js (compone repos existentes)
  3. Crear dashboard.controller.js + routes + validator
  4. Crear libro-fiscal.repository.js + service + controller + routes + validator
  5. Registrar ambos en routes/index.js
  6. Tests: dashboard.service.test.js + libro-fiscal.service.test.js
  7. Frontend: dashboard.service.js + useDashboard.js → Dashboard.jsx mejorado
  8. Frontend: libros-fiscal.service.js + useLibrosFiscal.js → LibroCompras.jsx + LibroVentas.jsx
  9. Router + sidebar (navItems.js)
  10. Frontend tests: Dashboard.test.jsx + LibroCompras.test.jsx
  11. Verificación: lint + test + build en ambos

Etapa 9 (infraestructura):
  1. Dockerfiles multi-stage (backend + frontend)
  2. .env.template actualizado
  3. CI/CD: job docker
  4. Root package.json
  5. DEPLOY.md
  6. Checklist seguridad
  7. Verificación: docker compose up --build desde cero
```

---

## Verificación Final

```bash
# Backend (debe incluir tests nuevos)
cd backend && npm run lint && npm test

# Frontend (debe incluir tests nuevos)
cd frontend && npm run lint && npm test && npm run build

# End-to-end (con Docker)
docker compose up -d mysql redis
cd backend && npm install && npm run db:migrate && npm run db:seed && npm run dev
# Probar endpoints:
curl http://localhost:4000/api/dashboard?gestion=2026
curl http://localhost:4000/api/libros-fiscales/compras?mes=6&gestion=2026
curl http://localhost:4000/api/libros-fiscales/ventas?mes=6&gestion=2026

# Docker build (Etapa 9)
docker build -t contabilidad-backend ./backend
docker build -t contabilidad-frontend ./frontend
```
