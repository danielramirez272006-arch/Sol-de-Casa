import { runMigrations } from './migrate.js';
import { runSeeds } from './seeds/run-seeds.js';
import { env } from '../src/config/env.js';

async function main() {
  console.log('====================================================');
  console.log('  SOL DE CASA · INICIALIZADOR DE BASE DE DATOS MYSQL');
  console.log('====================================================');
  console.log(`Configuración actual:`);
  console.log(`  - Servidor: ${env.db.host}:${env.db.port}`);
  console.log(`  - Usuario:  ${env.db.user}`);
  console.log(`  - Password: ${env.db.password ? '****** (configurada)' : '(vacía)'}`);
  console.log(`  - Base:     ${env.db.name}`);
  console.log('----------------------------------------------------');

  try {
    console.log('\n[Paso 1/2] Creando base de datos y tablas...');
    await runMigrations();

    console.log('\n[Paso 2/2] Insertando datos de demostración y administrador...');
    await runSeeds();

    console.log('\n====================================================');
    console.log('  ¡TODO LISTO Y CONFIGURADO CON ÉXITO EN MYSQL!');
    console.log('====================================================');
    console.log('Ya puedes iniciar el servidor backend ejecutando:');
    console.log('  npm run dev   (o ejecuta iniciar_backend.bat)');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[ERROR DURANTE LA CONFIGURACIÓN]:');
    console.error(`  ${err.message}`);
    console.error('\n--- GUÍA RÁPIDA DE SOLUCIÓN ---');
    if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
      console.error('1. Asegúrate de que el servicio de MySQL o XAMPP/WAMP esté INICIADO.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('2. Contraseña o usuario incorrecto: Abre backend/.env y ajusta DB_PASSWORD con tu clave de MySQL.');
    }
    console.error('--------------------------------\n');
    process.exit(1);
  }
}

main();

