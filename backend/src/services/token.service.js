import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { redisClient } from '../config/redis.js';

const sessionKey = (jti) => `session:${jti}`;

// TTL de la sesión en Redis, alineado al vencimiento del JWT (8h por defecto).
const ttlSeconds = () => {
  const m = String(env.jwt.expiresIn).match(/^(\d+)([smhd])$/);
  if (!m) return 8 * 3600;
  const n = Number(m[1]);
  return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2]];
};

export const tokenService = {
  async issue(empleado) {
    const jti = crypto.randomUUID();
    const payload = {
      sub: empleado.id_empleado,
      usuario: empleado.usuario,
      rol: empleado.rol?.nombre,
      id_sucursal: empleado.id_sucursal,
      jti,
    };
    const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    if (redisClient.isOpen) {
      await redisClient.set(sessionKey(jti), String(empleado.id_empleado), { EX: ttlSeconds() });
    }
    return token;
  },

  verify(token) {
    return jwt.verify(token, env.jwt.secret);
  },

  async isSessionActive(jti) {
    if (!redisClient.isOpen) return true; // sin Redis no se revoca (modo degradado)
    return (await redisClient.exists(sessionKey(jti))) === 1;
  },

  async revoke(jti) {
    if (redisClient.isOpen) await redisClient.del(sessionKey(jti));
  },
};
