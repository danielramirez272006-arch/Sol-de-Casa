import rateLimit from 'express-rate-limit';

// Limitador general para API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Demasiadas solicitudes desde esta dirección IP. Intenta nuevamente más tarde.'
  }
});

// Limitador estricto para autenticación (previene fuerza bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Demasiados intentos de acceso. Por seguridad, espera 15 minutos antes de reintentar.'
  }
});

// Limitador para creación de solicitudes públicas de vecinos (anti-spam)
export const solicitudesLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Demasiadas solicitudes enviadas. Por favor espera unos minutos.'
  }
});

