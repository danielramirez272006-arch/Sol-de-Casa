import { createApp } from './app.js';
import { env } from './config/env.js';
import { testConnection, closePool } from './config/db.js';

const app = createApp();

const server = app.listen(env.port, async () => {
  console.log(`====================================================`);
  console.log(`  Sol de Casa - Backend Server`);
  console.log(`  Modo: ${env.nodeEnv}`);
  console.log(`  Puerto: ${env.port}`);
  console.log(`  API disponible en: http://localhost:${env.port}/api/health`);
  console.log(`====================================================`);

  const dbStatus = await testConnection();
  if (dbStatus.ok) {
    console.log(`[BD] Conexión exitosa a MySQL en ${env.db.host}:${env.db.port} (BD: ${env.db.name})`);
  } else {
    console.warn(`[BD ATENCIÓN] No se pudo conectar a MySQL: ${dbStatus.error}`);
    console.warn(`  Verifica que el servicio MySQL esté ejecutándose y las credenciales en backend/.env sean correctas.`);
    console.warn(`  Las rutas de cálculo en /api/publico/calculadora siguen operativas de forma autónoma.`);
  }
});

// Cierre ordenado (graceful shutdown)
async function shutdown(signal) {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor HTTP y conexiones a base de datos...`);
  server.close(async () => {
    try {
      await closePool();
      console.log('Conexiones a base de datos cerradas.');
      process.exit(0);
    } catch (err) {
      console.error('Error al cerrar conexiones:', err);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default server;

