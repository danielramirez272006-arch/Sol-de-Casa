import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isDev = !isProd;

export const env = {
  nodeEnv,
  isProd,
  isDev,
  port: parseInt(process.env.PORT, 10) || 3001,
  corsOrigin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173',

  auth: {
    sessionCookieName: process.env.SESSION_COOKIE_NAME || 'sol_session',
    sessionSecret: process.env.SESSION_SECRET || process.env.SESSION_COOKIE_SECRET || 'sol_de_casa_default_secret_dev_32chars_long!',
    sessionTtlMs: (parseInt(process.env.SESSION_TTL_DAYS, 10) || 7) * 24 * 60 * 60 * 1000
  },

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    name: process.env.DB_NAME || 'sol_de_casa_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    waitForConnections: true,
    queueLimit: 0
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'danielramirez272006@gmail.com'
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Sol de Casa <no-reply@soldecasa.com>'
  },

  solar: {
    standardInstallationPrice: 6500.00,
    savingRate: 0.70, // 70%
    visitCost: 60.00,
    closingRateReferrals: 0.45, // 45%
    maxReferralCac: 300.00,
    rewardCleaningCost: 60.00,
    baseMonthlyCapacity: 100,
    capacityPerTechnician: 50
  }
};

export const config = env;
export default env;
