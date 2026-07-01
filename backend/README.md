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

### Cierre de gestión (Etapa 7)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/cierres` | CONTADOR/GERENTE | Lista de cierres |
| GET | `/api/cierres/:id` | CONTADOR/GERENTE | Detalle de cierre |
| POST | `/api/cierres` | CONTADOR | Cierra gestión anual (body: `{ anio }`) |

### Dashboard (Etapa 8)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/dashboard` | CONTADOR/GERENTE | KPIs (params: `gestion`, `mes`) → utilidad, IVA débito/crédito/neto, estado cierre |

### Libros fiscales (Etapa 8)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/libros-fiscales/compras` | CONTADOR/GERENTE | Libro de Compras (params: `mes`, `gestion`) |
| GET | `/api/libros-fiscales/ventas` | CONTADOR/GERENTE | Libro de Ventas (params: `mes`, `gestion`) |

### Usuarios demo (seeder)
| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `contador` | `Contador123` | CONTADOR |
| `gerente` | `Gerente123` | GERENTE |

## Pruebas
```bash
npm test        # Jest + Supertest (69 tests)
```
