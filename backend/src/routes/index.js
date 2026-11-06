import { Router } from 'express';
import authRoutes from './authRoutes.js';
import familiasRoutes from './familiasRoutes.js';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';
import { testConnection } from '../config/db.js';

const router = Router();

// Healthcheck y estado de la base de datos
router.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    ok: true,
    servicio: 'Sol de Casa API Backend',
    version: '1.0.0',
    estado: 'operativo',
    database: {
      conectada: dbStatus.ok,
      detalle: dbStatus.ok ? 'Conexión a MySQL activa' : dbStatus.error
    },
    integracionFabricante: {
      estado: 'pendiente_credenciales_api',
      descripcion: 'Pendiente de credenciales oficiales y API del fabricante de inversores solares'
    },
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/familias', familiasRoutes);
router.use('/publico', publicRoutes);
router.use('/admin', adminRoutes);

export default router;

