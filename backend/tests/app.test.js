import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('App scaffolding (Etapa 0)', () => {
  const app = createApp();

  it('GET /api responde con metadatos de la API', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Contabilidad API');
  });

  it('responde 404 con JSON en rutas desconocidas', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
