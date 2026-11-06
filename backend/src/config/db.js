import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool = null;
let isConnected = false;

export function getDbConfig() {
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: env.db.waitForConnections,
    connectionLimit: env.db.connectionLimit,
    queueLimit: env.db.queueLimit,
    decimalNumbers: true,
    timezone: 'Z',
    charset: 'utf8mb4'
  };
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(getDbConfig());
  }
  return pool;
}

export async function testConnection() {
  try {
    const p = getPool();
    const [rows] = await p.query('SELECT 1 + 1 AS resultado');
    isConnected = true;
    return { ok: true, resultado: rows[0].resultado };
  } catch (error) {
    isConnected = false;
    return { ok: false, error: error.message, code: error.code };
  }
}

export async function query(sql, params = []) {
  const p = getPool();
  const [results] = await p.query(sql, params);
  return results;
}

export async function withTransaction(callback) {
  const p = getPool();
  const connection = await p.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rbError) {
      console.error('Error al hacer rollback:', rbError.message);
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    isConnected = false;
  }
}

export { isConnected };

