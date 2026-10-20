import express from 'express';
import { register, login, googleAuth, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody, registerSchema, loginSchema, googleAuthSchema } from '../validators/index.js';

const router = express.Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/google', authLimiter, validateBody(googleAuthSchema), googleAuth);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
