# Módulo de Contabilidad — Flowy ERP

**La carpeta `Modulo_activo_fijos` es un nombre residual. El módulo real es Contabilidad y Finanzas.**

Proyecto académico (ERP MarketSuper). Stack: Node 20 + Express 4 + Sequelize + MySQL 8 + Redis 7 (backend), React 18 + Vite + Tailwind (frontend).

## Reglas críticas

- **JavaScript ES2022 ESM. NO TypeScript.** El cliente lo prohibió explícitamente.
- Backend es `"type": "module"`. Las migraciones y seeders son `.cjs` porque sequelize-cli es CommonJS.
- No versionar `backend/.env` — usar `.env.template` como referencia.
- El plan de cuentas es boliviano (normativa SIN). Los códigos de cuenta son la clave lógica, no los IDs.

## Comandos

```bash
# Entorno completo (requiere Docker)
docker compose up -d mysql redis     # esperar healthy
cd backend && cp .env.template .env && npm install
npm run db:migrate && npm run db:seed && npm run dev   # :4000

# Frontend (otra terminal)
cd frontend && npm install && npm run dev              # :5173 (proxy /api → :4000)

# Verificación (debe pasar siempre antes de commit)
cd backend && npm run lint && npm test      # 69 tests
cd frontend && npm run lint && npm test && npm run build    # 3 tests

# Health check
curl http://localhost:4000/health
```

**Tests backend** necesitan `--experimental-vm-modules` (ya configurado en el script `test`).
**Seeders** son idempotentes (`seederStorage: sequelize` en `database/config.cjs`).

## Arquitectura backend (capas estrictas)

```
routes → controller → service → repository → model
(HTTP)   (HTTP↔app)   (negocio)  (datos)     (Sequelize)
```

- **Controllers**: traducen request/response. Sin lógica de negocio.
- **Services**: toda la lógica. Se crean con inyección de dependencias: `createXxxService({ repo })`. Exportan también una instancia por defecto.
- **Repositories**: aíslan Sequelize del resto (DIP).
- **Models**: entidades Sequelize. Asociaciones centralizadas en `models/index.js`.
- **Validators**: esquemas Zod. Se usan con `validateBody()` middleware.
- **Errors**: lanzar `ApiError.badRequest/unauthorized/...` desde services. Envolver handlers con `asyncHandler(...)`.

## Arquitectura frontend

- **Design system** en `components/ui/`: Button, Card, Input, Select, Modal, Badge, Spinner, EmptyState, PageHeader. Todas las páginas los reutilizan.
- **Estética**: paleta neutra + acento sobrio, fuente Inter, sin degradados ni emojis.
- **Datos**: React Query (`queries/useXxx.js`) + Axios único en `services/api.js`.
- **Auth**: `AuthContext` (token en localStorage, auto-logout ante 401).
- **Rutas protegidas**: `ProtectedRoute` con roles. Escritura contable solo `CONTADOR`. Lectura: `CONTADOR` + `GERENTE`.

## Receta para añadir un recurso

**Backend** (en orden): model → migration → (seeder) → repository → service → validator → controller → route → registrar en `routes/index.js` → test.

**Frontend**: service → query hook → page → conectar en `router/AppRouter.jsx`.

## Gotchas

- **bcrypt** compila nativo; si falla, reinstalar o considerar `bcryptjs`.
- **ESLint 9 flat config** en ambos proyectos. `eslint-plugin-react-hooks` debe ser v5 (v4 no soporta ESLint 9).
- **Jest frontend** usa Babel solo para tests (`babel.config.cjs`); Vite usa esbuild aparte.
- **Cierre de gestión** (Etapa 7) bloquea el período: no se pueden crear/editar/asientos de un año cerrado.
- **Balance General** usa saldos acumulados hasta `fecha_fin` (no solo el período), e incorpora el resultado del ejercicio al patrimonio.
- **IVA boliviano 13%** se calcula "por dentro" (el monto incluye el IVA).

## Estado actual

Etapas 0–8 completas. Siguiente: **Etapa 9 (Preparación despliegue)**.
Ver `PROGRESO.md` para detalle y `GUIA_CONTINUIDAD.md` para contexto completo.

### Endpoints Etapa 8 (Dashboard + Libros Fiscales)
- `GET /api/dashboard?gestion=2026&mes=6` — KPIs: utilidad, IVA débito/crédito/neto, estado cierre
- `GET /api/libros-fiscales/compras?mes=6&gestion=2026` — Libro de Compras con IVA desglosado
- `GET /api/libros-fiscales/ventas?mes=6&gestion=2026` — Libro de Ventas con IVA desglosado

## Usuarios demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `contador` | `Contador123` | CONTADOR |
| `gerente` | `Gerente123` | GERENTE |
