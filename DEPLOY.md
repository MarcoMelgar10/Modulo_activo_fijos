# Despliegue — Módulo de Contabilidad (Flowy ERP)

## Requisitos

- Docker 24+ con Docker Compose v2
- MySQL 8 (incluido en docker-compose)
- Redis 7 (incluido en docker-compose)

## Variables de entorno

Copiar `backend/.env.template` como `backend/.env` y ajustar:

```bash
cp backend/.env.template backend/.env
```

**Obligatorias en producción:**

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Modo de ejecución |
| `DB_HOST` | `mysql` | Host de MySQL (nombre del contenedor) |
| `DB_PASSWORD` | *(cambiar)* | Password del usuario de BD |
| `REDIS_URL` | `redis://redis:6379` | URL de Redis |
| `JWT_SECRET` | *(generar con `openssl rand -hex 32`)* | Secreto para firmar JWT |
| `CORS_ORIGIN` | `https://tu-dominio.com` | URL del frontend en producción |

## Despliegue con Docker Compose

```bash
# 1. Clonar el repositorio
git clone <repo-url> && cd Modulo_activo_fijos

# 2. Configurar variables de entorno
cp backend/.env.template backend/.env
# Editar backend/.env con los valores de producción

# 3. Levantar servicios
docker compose up -d --build

# 4. Ejecutar migraciones y seeders
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed

# 5. Verificar
curl http://localhost:4000/health
# Abrir http://localhost:8080 en el navegador
```

## Despliegue manual (sin Docker)

```bash
# Backend
cd backend
cp .env.template .env
npm install --omit=dev
npm run db:migrate
npm run db:seed
NODE_ENV=production node src/server.js

# Frontend
cd frontend
npm install
npm run build
# Servir dist/ con nginx o cualquier servidor estático
```

## Usuarios demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `contador` | `Contador123` | CONTADOR |
| `gerente` | `Gerente123` | GERENTE |

**En producción:** cambiar las contraseñas de los usuarios demo antes de exponer el sistema.

## Health check

```bash
curl http://localhost:4000/health
# Respuesta esperada: { "status": "ok", "checks": { "server": "ok", "database": "ok", "redis": "ok" } }
```

## Arquitectura de contenedores

```
                    ┌──────────────┐
                    │   Frontend   │
                    │  (nginx:80)  │
                    └──────┬───────┘
                           │ proxy /api → :4000
                    ┌──────┴───────┐
                    │   Backend    │
                    │ (node:4000)  │
                    └──┬────────┬──┘
                       │        │
              ┌────────┴──┐  ┌──┴────────┐
              │  MySQL 8  │  │  Redis 7  │
              │  (:3306)  │  │  (:6379)  │
              └───────────┘  └───────────┘
```
