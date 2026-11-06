import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  const respuesta = {
    ok: false,
    error: err.message || 'Error interno del servidor'
  };

  if (env.isDev && err.stack) {
    respuesta.stack = err.stack;
  }

  res.status(statusCode).json(respuesta);
}

