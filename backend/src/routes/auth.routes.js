import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { loginSchema } from '../validators/auth.validators.js';

const router = Router();

// Límite específico para login (defensa contra fuerza bruta, complementa el bloqueo por intentos).
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

export default router;
