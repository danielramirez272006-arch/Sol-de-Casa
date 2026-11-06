import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { autenticar, requerirRol } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de administración requieren rol estricto 'admin'
router.use(autenticar);
router.use(requerirRol('admin'));

router.get('/resumen', AdminController.getResumenDashboard);
router.get('/solicitudes', AdminController.getSolicitudes);
router.patch('/solicitudes/:id/estado', AdminController.patchEstadoSolicitud);
router.post('/ventas/confirmar', AdminController.postConfirmarVenta);
router.patch('/recompensas/:id/estado', AdminController.patchEstadoRecompensa);
router.post('/ahorros', AdminController.postAhorroMensual);
router.get('/familias', AdminController.getFamilias);

export default router;

