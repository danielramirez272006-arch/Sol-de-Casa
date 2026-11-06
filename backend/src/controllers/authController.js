import { AuthService } from '../services/authService.js';

export class AuthController {
  static async postRegistro(req, res, next) {
    try {
      const { email, password, nombreFamilia, titularNombre, telefono, direccion } = req.body;
      const resultado = await AuthService.registrarFamilia({
        email,
        password,
        nombreFamilia,
        titularNombre,
        telefono,
        direccion
      });
      res.status(201).json({ ok: true, data: resultado });
    } catch (err) {
      next(err);
    }
  }

  static async getVerificarEmail(req, res, next) {
    try {
      const token = req.query.token || req.body?.token;
      const resultado = await AuthService.verificarEmail(token);
      res.json({ ok: true, data: resultado });
    } catch (err) {
      next(err);
    }
  }

  static async postLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || null;

      const resultado = await AuthService.login({
        email,
        password,
        ipAddress,
        userAgent
      });

      // Configurar cookie segura HttpOnly
      AuthService.configurarCookieSesion(res, resultado.sessionToken);

      res.json({
        ok: true,
        data: {
          usuario: resultado.usuario,
          expiraEn: resultado.expiraEn,
          token: resultado.sessionToken // Para clientes API que prefieran encabezado Bearer
        }
      });
    } catch (err) {
      res.status(401).json({ ok: false, error: err.message });
    }
  }

  static async postLogout(req, res, next) {
    try {
      const token = req.cookies?.sol_session || 
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
          ? req.headers.authorization.slice(7) 
          : null);

      if (token) {
        await AuthService.logout(token);
      }
      AuthService.limpiarCookieSesion(res);
      res.json({ ok: true, mensaje: 'Sesión cerrada exitosamente.' });
    } catch (err) {
      next(err);
    }
  }

  static async postForgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const resultado = await AuthService.solicitarRecuperacionPassword(email);
      res.json({ ok: true, data: resultado });
    } catch (err) {
      next(err);
    }
  }

  static async postResetPassword(req, res, next) {
    try {
      const { token, nuevaPassword } = req.body;
      const resultado = await AuthService.resetPassword({ token, nuevaPassword });
      res.json({ ok: true, data: resultado });
    } catch (err) {
      next(err);
    }
  }

  static async getPerfil(req, res) {
    res.json({
      ok: true,
      data: {
        usuario: req.user
      }
    });
  }
}

