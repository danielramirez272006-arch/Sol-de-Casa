import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('--- Iniciando migraciones de base de datos ---');
  console.log(`Conectando a MySQL en ${env.db.host}:${env.db.port} con usuario "${env.db.user}"...`);

  // Conexión inicial sin especificar base de datos para crearla si no existe
  let rootConnection;
  try {
    rootConnection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true
    });
  } catch (err) {
    console.error(`[ERROR] No fue posible conectar al servidor MySQL en ${env.db.host}:${env.db.port}.`);
    console.error(`Detalle: ${err.message}`);
    console.error('\nComprueba que el servicio de MySQL esté iniciado y que las credenciales en backend/.env sean correctas.');
    throw err;
  }

  try {
    console.log(`Verificando existencia de la base de datos "${env.db.name}"...`);
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`Base de datos "${env.db.name}" lista.`);
  } finally {
    await rootConnection.end();
  }

  // Ahora conectar con la base de datos seleccionada
  const dbConnection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: true
  });

  try {
    // Crear tabla de control de migraciones si no existe
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS migraciones_ejecutadas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL UNIQUE,
        ejecutada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    const [rows] = await dbConnection.query('SELECT nombre FROM migraciones_ejecutadas');
    const ejecutadas = new Set(rows.map(r => r.nombre));

    for (const file of files) {
      if (ejecutadas.has(file)) {
        console.log(`  [OK] ${file} ya ejecutada previamente.`);
        continue;
      }

      console.log(`  [EJECUTANDO] ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await dbConnection.query(sql);
      await dbConnection.query('INSERT INTO migraciones_ejecutadas (nombre) VALUES (?)', [file]);
      console.log(`  [COMPLETADO] ${file}`);
    }

    console.log('--- Migraciones completadas con éxito ---');
  } finally {
    await dbConnection.end();
  }
}

// Ejecutar si se invoca directamente desde CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

