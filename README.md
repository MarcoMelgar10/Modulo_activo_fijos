# Módulo de Contabilidad — Flowy ERP (MarketSuper)

Módulo de **Contabilidad y Finanzas** del ERP Flowy. Implementa el plan de cuentas, asientos
contables (manuales y automáticos), libros contables, estados financieros y cierre de gestión,
según los requisitos **RF-CON-01..05** y el diccionario de datos §3.6.4 de la documentación del
proyecto.

> Nota: la carpeta se llama `Modulo_activo_fijos` por un remanente del repositorio; el alcance
> real y confirmado es el **módulo de Contabilidad**.

## Stack

| Capa     | Tecnologías |
|----------|-------------|
| Frontend | React 18 (Vite), Tailwind CSS 3, Axios + React Query, React Router v6, Jest + Testing Library |
| Backend  | Node.js 20 LTS, Express 4, Sequelize ORM, JWT + bcrypt, Winston, Jest + Supertest |
| Datos    | MySQL 8, Redis 7 |
| DevOps   | Docker + Compose, GitHub Actions, ESLint + Prettier, GitFlow |

## Estructura

```
backend/    API REST (capas: routes → controller → service → repository → model)
frontend/   SPA React (design system en components/ui)
docker-compose.yml
```

## Puesta en marcha (desarrollo)

```bash
# Todo el entorno (MySQL + Redis + backend + frontend)
docker compose up --build

# O manual:
cd backend && npm install && npm run dev      # http://localhost:4000
cd frontend && npm install && npm run dev      # http://localhost:5173
```

Health check del backend: `GET http://localhost:4000/health`

## Estado del proyecto

Ver [PROGRESO.md](PROGRESO.md) para el avance por etapas.

## Continuar el desarrollo

Si retomas el proyecto (incluso desde otra máquina), lee primero
[GUIA_CONTINUIDAD.md](GUIA_CONTINUIDAD.md): explica qué es la app, cómo está construida, en qué
etapa está y cómo seguir paso a paso.
