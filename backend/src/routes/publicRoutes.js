import { Router } from 'express';
import { PublicController } from '../controllers/publicController.js';
import { solicitudesLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Calculadora de ahorro solar para vecinos
router.post('/calculadora', PublicController.postCalculadora);

// Consulta pública de invitación por código de referido
router.get('/invitacion/:codigo', PublicController.getInvitacionReferido);

// Formulario público de solicitud de visita técnica (con limitador anti-spam)
router.post('/solicitudes', solicitudesLimiter, PublicController.postSolicitudVisita);

export default router;

