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

### Usuarios demo (seeder)
| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `contador` | `Contador123` | CONTADOR |
| `gerente` | `Gerente123` | GERENTE |

## Pruebas
```bash
npm test        # Jest + Supertest
```
