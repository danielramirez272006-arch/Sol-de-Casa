import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { validarEmail, validarPassword } from '../validators/schemas.js';

export class AuthService {
  /**
   * Registro público de familias.
   * Por seguridad estricta, NUNCA permite elegir rol 'admin'.
   */
  static async registrarFamilia({ email, password, nombreFamilia, titularNombre, telefono, direccion }) {
    if (!validarEmail(email)) {
      throw new Error('El formato del correo electrónico es inválido.');
    }
    if (!validarPassword(password)) {
      throw new Error('La contraseña debe tener al menos 8 caracteres, incluyendo letras y números.');
    }
    if (!nombreFamilia || nombreFamilia.trim().length < 2) {
      throw new Error('El nombre de la familia es obligatorio.');
    }

    const emailNormalizado = email.trim().toLowerCase();

    // Comprobar si ya existe
    const existentes = await query('SELECT id FROM usuarios WHERE email = ?', [emailNormalizado]);
    if (existentes.length > 0) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    return await withTransaction(async (conn) => {
      // 1. Crear usuario con rol 'familia' (estricto)
      const [resUser] = await conn.query(
        `INSERT INTO usuarios (email, password_hash, rol, email_verificado, token_verificacion, token_verificacion_expira)
         VALUES (?, ?, 'familia', FALSE, ?, ?)`,
        [emailNormalizado, passwordHash, tokenVerificacion, tokenExpira]
      );
      const usuarioId = resUser.insertId;

      // 2. Crear ficha de familia
      const [resFam] = await conn.query(
        `INSERT INTO familias (usuario_id, nombre_familia, titular_nombre, telefono, direccion, recibo_anterior_usd, porcentaje_ahorro_estimado)
         VALUES (?, ?, ?, ?, ?, 110.00, 70.00)`,
        [usuarioId, nombreFamilia.trim(), titularNombre?.trim() || null, telefono?.trim() || null, direccion?.trim() || null]
      );
      const familiaId = resFam.insertId;

      // 3. Generar código de referido inicial único
      const codigoUnico = 'SOL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      await conn.query(
        `INSERT INTO codigos_referido (familia_id, codigo, activo) VALUES (?, ?, TRUE)`,
        [familiaId, codigoUnico]
      );

      return {
        usuarioId,
        familiaId,
        email: emailNormalizado,
        nombreFamilia: nombreFamilia.trim(),
        codigoReferido: codigoUnico,
        tokenVerificacion,
        mensaje: 'Cuenta registrada. Por favor verifica tu correo electrónico.'
      };
    });
  }

  static async verificarEmail(token) {
    if (!token) throw new Error('Token de verificación requerido.');

    const usuarios = await query(
      `SELECT id, email, token_verificacion_expira 
       FROM usuarios 
       WHERE token_verificacion = ? AND activo = TRUE`,
      [token]
    );

    if (usuarios.length === 0) {
      throw new Error('Token de verificación inválido o expirado.');
    }

    const usuario = usuarios[0];
    if (usuario.token_verificacion_expira && new Date(usuario.token_verificacion_expira) < new Date()) {
      throw new Error('El token de verificación ha expirado. Solicita uno nuevo.');
    }

    await query(
      `UPDATE usuarios 
       SET email_verificado = TRUE, token_verificacion = NULL, token_verificacion_expira = NULL 
       WHERE id = ?`,
      [usuario.id]
    );

    return { ok: true, email: usuario.email, mensaje: 'Correo electrónico verificado con éxito.' };
  }

  static async login({ email, password, ipAddress = null, userAgent = null }) {
    if (!validarEmail(email) || !password) {
      throw new Error('Credenciales inválidas.');
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarios = await query(
      `SELECT u.id, u.email, u.password_hash, u.rol, u.email_verificado, u.activo,
              f.id AS familia_id, f.nombre_familia
       FROM usuarios u
       LEFT JOIN familias f ON f.usuario_id = u.id
       WHERE u.email = ?
       LIMIT 1`,
      [emailNormalizado]
    );

    if (usuarios.length === 0) {
      throw new Error('Credenciales incorrectas o cuenta no encontrada.');
    }

    const usuario = usuarios[0];

    if (!usuario.activo) {
      throw new Error('Esta cuenta se encuentra inactiva. Contacta al administrador.');
    }

    if (!usuario.password_hash) {
      throw new Error('La cuenta aún no tiene contraseña establecida. Revisa tu correo de invitación.');
    }

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      throw new Error('Credenciales incorrectas.');
    }

    // Generar token de sesión seguro
    const sessionToken = crypto.randomBytes(48).toString('hex');
    const expiraEn = new Date(Date.now() + env.auth.sessionTtlMs);

    await query(
      `INSERT INTO sesiones (usuario_id, token, expira_en, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario.id, sessionToken, expiraEn, ipAddress, userAgent]
    );

    return {
      sessionToken,
      expiraEn,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        emailVerificado: Boolean(usuario.email_verificado),
        familiaId: usuario.familia_id,
        nombreFamilia: usuario.nombre_familia
      }
    };
  }

  static async logout(sessionToken) {
    if (!sessionToken) return { ok: true };
    await query('DELETE FROM sesiones WHERE token = ?', [sessionToken]);
    return { ok: true, mensaje: 'Sesión cerrada correctamente.' };
  }

  static async solicitarRecuperacionPassword(email) {
    if (!validarEmail(email)) {
      throw new Error('Correo electrónico inválido.');
    }

    const emailNormalizado = email.trim().toLowerCase();
    const usuarios = await query('SELECT id, activo FROM usuarios WHERE email = ?', [emailNormalizado]);

    // Respuesta genérica para evitar enumeración de usuarios
    if (usuarios.length === 0 || !usuarios[0].activo) {
      return {
        ok: true,
        mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.'
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      `UPDATE usuarios 
       SET token_recuperacion = ?, token_recuperacion_expira = ? 
       WHERE id = ?`,
      [token, expira, usuarios[0].id]
    );

    return {
      ok: true,
      token, // En desarrollo se devuelve o se enviaría por correo
      mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.'
    };
  }

  static async resetPassword({ token, nuevaPassword }) {
    if (!token) throw new Error('Token requerido.');
    if (!validarPassword(nuevaPassword)) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres, incluyendo letras y números.');
    }

    const usuarios = await query(
      `SELECT id, token_recuperacion_expira 
       FROM usuarios 
       WHERE token_recuperacion = ? AND activo = TRUE`,
      [token]
    );

    if (usuarios.length === 0) {
      throw new Error('Token de recuperación inválido o expirado.');
    }

    const usuario = usuarios[0];
    if (usuario.token_recuperacion_expira && new Date(usuario.token_recuperacion_expira) < new Date()) {
      throw new Error('El token de recuperación ha expirado.');
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 12);

    await query(
      `UPDATE usuarios 
       SET password_hash = ?, token_recuperacion = NULL, token_recuperacion_expira = NULL, email_verificado = TRUE 
       WHERE id = ?`,
      [nuevoHash, usuario.id]
    );

    // Invalidar sesiones previas por seguridad
    await query('DELETE FROM sesiones WHERE usuario_id = ?', [usuario.id]);

    return { ok: true, mensaje: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' };
  }

  static configurarCookieSesion(res, token) {
    res.cookie(env.auth.sessionCookieName, token, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: env.auth.sessionTtlMs,
      path: '/'
    });
  }

  static limpiarCookieSesion(res) {
    res.clearCookie(env.auth.sessionCookieName, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      path: '/'
    });
  }
}

