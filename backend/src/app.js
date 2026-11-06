import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  // Configuración de CORS segura para cookies HttpOnly
  const allowedOrigins = [
    env.corsOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como curl, Postman o file:// locales)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // En desarrollo permitir orígenes locales
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Limitador de tasa para rutas API
  app.use('/api', apiLimiter);

  // Montar rutas de la API
  app.use('/api', apiRoutes);

  // Manejo de 404 y errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;

