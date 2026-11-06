import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { autenticar } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Rutas públicas de autenticación con limitador estricto
router.post('/registro', authLimiter, AuthController.postRegistro);
router.get('/verificar-email', AuthController.getVerificarEmail);
router.post('/login', authLimiter, AuthController.postLogin);
router.post('/logout', AuthController.postLogout);
router.post('/recuperar-password', authLimiter, AuthController.postForgotPassword);
router.post('/reset-password', authLimiter, AuthController.postResetPassword);

// Ruta protegida de perfil
router.get('/perfil', autenticar, AuthController.getPerfil);

export default router;

