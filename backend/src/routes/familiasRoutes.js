import { Router } from 'express';
import { FamiliasController } from '../controllers/familiasController.js';
import { autenticar, requerirRol } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de familias requieren sesión activa y rol 'familia' (o 'admin')
router.use(autenticar);
router.use(requerirRol('familia', 'admin'));

router.get('/mi-ahorro', FamiliasController.getMiAhorro);
router.get('/compartir', FamiliasController.getCompartir);
router.get('/mis-referidos', FamiliasController.getMisReferidosYRecompensas);
router.post('/telemetria', FamiliasController.postEventoTelemetria);

export default router;

