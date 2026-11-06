import { query } from '../config/db.js';

export async function autenticar(req, res, next) {
  try {
    const token = req.cookies?.sol_session || 
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
        ? req.headers.authorization.slice(7) 
        : null);

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'No autenticado. Por favor inicia sesión.'
      });
    }

    const rows = await query(
      `SELECT s.id AS sesion_id, s.token, s.expira_en,
              u.id AS usuario_id, u.email, u.rol, u.email_verificado, u.activo,
              f.id AS familia_id, f.nombre_familia
       FROM sesiones s
       INNER JOIN usuarios u ON u.id = s.usuario_id
       LEFT JOIN familias f ON f.usuario_id = u.id
       WHERE s.token = ? AND s.expira_en > NOW() AND u.activo = TRUE
       LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        error: 'Sesión inválida o expirada. Por favor vuelve a iniciar sesión.'
      });
    }

    const sesion = rows[0];
    req.user = {
      id: sesion.usuario_id,
      email: sesion.email,
      rol: sesion.rol,
      emailVerificado: Boolean(sesion.email_verificado),
      familiaId: sesion.familia_id,
      nombreFamilia: sesion.nombre_familia,
      sesionId: sesion.sesion_id
    };

    next();
  } catch (error) {
    console.error('Error en autenticación middleware:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno verificando la sesión.'
    });
  }
}

export function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Autenticación requerida.' });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        error: 'Acceso denegado. No tienes permisos suficientes para realizar esta acción.'
      });
    }

    next();
  };
}

export function aislarFamilia(req, res, next) {
  // Los administradores tienen acceso total
  if (req.user && req.user.rol === 'admin') {
    return next();
  }

  // Las familias sólo acceden a su propio id
  const familiaIdParam = Number(req.params.familiaId || req.query.familiaId || req.body?.familiaId);
  if (familiaIdParam && req.user && req.user.familiaId !== familiaIdParam) {
    return res.status(403).json({
      ok: false,
      error: 'Acceso denegado. No puedes consultar ni modificar datos de otra familia.'
    });
  }

  next();
}

