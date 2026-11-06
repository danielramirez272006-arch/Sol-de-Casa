import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { env } from '../../src/config/env.js';

export async function runSeeds() {
  console.log('--- Iniciando carga de datos iniciales (seeds) ---');
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    multipleStatements: true
  });

  try {
    await conn.beginTransaction();

    // 1. Administrador previsto
    // Directriz estricta: NO inventar contraseña en el código.
    // Si se definió ADMIN_INITIAL_PASSWORD en el entorno, se hashea; si no, se genera token de configuración de primer acceso.
    const adminEmail = env.admin.email;
    const [adminExistente] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [adminEmail]);

    let adminId;
    if (adminExistente.length === 0) {
      const inviteToken = crypto.randomBytes(32).toString('hex');
      let passwordHash = null;
      let emailVerificado = false;
      let activo = false;

      if (process.env.ADMIN_INITIAL_PASSWORD) {
        passwordHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 12);
        emailVerificado = true;
        activo = true;
      }

      const [resAdmin] = await conn.query(
        `INSERT INTO usuarios (email, password_hash, rol, email_verificado, activo, token_verificacion)
         VALUES (?, ?, 'admin', ?, ?, ?)`,
        [adminEmail, passwordHash, emailVerificado, activo, inviteToken]
      );
      adminId = resAdmin.insertId;
      console.log(`[SEED] Usuario administrador creado: ${adminEmail} (ID: ${adminId})`);
      if (!process.env.ADMIN_INITIAL_PASSWORD) {
        console.log(`[SEED] No se definió ADMIN_INITIAL_PASSWORD. Token de configuración inicial generado: ${inviteToken}`);
      }
    } else {
      adminId = adminExistente[0].id;
      console.log(`[SEED] Administrador ya existente: ${adminEmail} (ID: ${adminId})`);
    }

    // 2. Familia de demostración (Familia Gómez)
    const gomezEmail = 'familia.gomez@ejemplo.com';
    const [familiaUserExist] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [gomezEmail]);
    let gomezUserId;

    if (familiaUserExist.length === 0) {
      // Contraseña de demostración hasheada sólo si no existe
      const demoHash = await bcrypt.hash('FamiliaGomez2026!', 10);
      const [resUser] = await conn.query(
        `INSERT INTO usuarios (email, password_hash, rol, email_verificado, activo)
         VALUES (?, ?, 'familia', TRUE, TRUE)`,
        [gomezEmail, demoHash]
      );
      gomezUserId = resUser.insertId;
    } else {
      gomezUserId = familiaUserExist[0].id;
    }

    const [familiaExist] = await conn.query('SELECT id FROM familias WHERE usuario_id = ?', [gomezUserId]);
    let familiaId;

    if (familiaExist.length === 0) {
      const [resFam] = await conn.query(
        `INSERT INTO familias (usuario_id, nombre_familia, titular_nombre, direccion, fecha_instalacion, capacidad_kw, recibo_anterior_usd, porcentaje_ahorro_estimado, notas)
         VALUES (?, 'Familia Gómez', 'Carlos Gómez', 'Calle Las Palmeras 124, Barrio Solar', '2026-01-15', 5.20, 110.00, 70.00, 'Instalación piloto Caso C')`,
        [gomezUserId]
      );
      familiaId = resFam.insertId;
      console.log(`[SEED] Familia Gómez creada (ID: ${familiaId})`);
    } else {
      familiaId = familiaExist[0].id;
      console.log(`[SEED] Familia Gómez ya existente (ID: ${familiaId})`);
    }

    // 3. Código de referido único para la Familia Gómez
    const codigoGomez = 'GOMEZ70SOL';
    const [codigoExist] = await conn.query('SELECT id FROM codigos_referido WHERE codigo = ?', [codigoGomez]);
    let codigoReferidoId;

    if (codigoExist.length === 0) {
      const [resCod] = await conn.query(
        `INSERT INTO codigos_referido (familia_id, codigo, activo)
         VALUES (?, ?, TRUE)`,
        [familiaId, codigoGomez]
      );
      codigoReferidoId = resCod.insertId;
      console.log(`[SEED] Código de referido creado: ${codigoGomez}`);
    } else {
      codigoReferidoId = codigoExist[0].id;
    }

    // 4. Registros de ahorros mensuales simulados (marcardos explícitamente como simulados)
    // Recibo anterior: $110. Ahorro: 70% ($77 mensuales)
    const periodos = [
      { periodo: '2026-01', monto: 77.00, recibo_red: 33.00, gen_kwh: 480.00 },
      { periodo: '2026-02', monto: 77.00, recibo_red: 33.00, gen_kwh: 510.00 },
      { periodo: '2026-03', monto: 77.00, recibo_red: 33.00, gen_kwh: 525.00 },
      { periodo: '2026-04', monto: 77.00, recibo_red: 33.00, gen_kwh: 495.00 }
    ];

    for (const p of periodos) {
      await conn.query(
        `INSERT INTO ahorros_mensuales (familia_id, periodo, ahorro_usd, recibo_red_usd, generacion_kwh, tipo_registro, notas)
         VALUES (?, ?, ?, ?, ?, 'simulado', 'Dato de demostración Parte 2 del caso')
         ON DUPLICATE KEY UPDATE ahorro_usd = VALUES(ahorro_usd), tipo_registro = 'simulado'`,
        [familiaId, p.periodo, p.monto, p.recibo_red, p.gen_kwh]
      );
    }
    console.log('[SEED] Ahorros mensuales simulados registrados (4 meses x $77 = $308 acumulados)');

    // 5. Solicitudes de visita de demostración (Panel de Andrés)
    // 3 vecinos referidos con distintos estados de la máquina de estados:
    // a) Vecina Marta: venta_confirmada (con recompensa asignada)
    // b) Vecino Roberto: agendada
    // c) Vecino Esteban: solicitada
    const solicitudesDemo = [
      {
        nombre: 'Marta Rivas',
        telefono: '+34 600 111 222',
        email: 'marta.rivas@ejemplo.com',
        direccion: 'Calle Las Palmeras 130',
        recibo_actual: 120.00,
        ahorro_estimado: 84.00,
        estado: 'venta_confirmada',
        idempotency_key: 'seed-demo-marta-001'
      },
      {
        nombre: 'Roberto Fernández',
        telefono: '+34 600 333 444',
        email: 'roberto.f@ejemplo.com',
        direccion: 'Calle Las Palmeras 118',
        recibo_actual: 110.00,
        ahorro_estimado: 77.00,
        estado: 'agendada',
        idempotency_key: 'seed-demo-roberto-002'
      },
      {
        nombre: 'Esteban Morales',
        telefono: '+34 600 555 666',
        email: 'esteban.m@ejemplo.com',
        direccion: 'Av. Del Sol 45',
        recibo_actual: 140.00,
        ahorro_estimado: 98.00,
        estado: 'solicitada',
        idempotency_key: 'seed-demo-esteban-003'
      }
    ];

    for (const s of solicitudesDemo) {
      const [exist] = await conn.query('SELECT id FROM solicitudes_visita WHERE idempotency_key = ?', [s.idempotency_key]);
      if (exist.length === 0) {
        const [resSol] = await conn.query(
          `INSERT INTO solicitudes_visita (
            codigo_referido_id, familia_referidora_id, nombre_vecino, telefono, email, direccion,
            recibo_actual_usd, ahorro_estimado_usd, estado, consentimiento_contacto, es_simulada, idempotency_key
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, ?)`,
          [codigoReferidoId, familiaId, s.nombre, s.telefono, s.email, s.direccion, s.recibo_actual, s.ahorro_estimado, s.estado, s.idempotency_key]
        );
        const solId = resSol.insertId;

        if (s.estado === 'agendada' || s.estado === 'venta_confirmada') {
          const [resVis] = await conn.query(
            `INSERT INTO visitas (solicitud_id, fecha_programada, estado, resultado_visita, costo_visita_usd)
             VALUES (?, '2026-04-10 10:00:00', ?, ?, 60.00)`,
            [solId, s.estado === 'venta_confirmada' ? 'realizada' : 'programada', s.estado === 'venta_confirmada' ? 'interesado' : 'pendiente']
          );
          const visitaId = resVis.insertId;

          if (s.estado === 'venta_confirmada') {
            const [resVenta] = await conn.query(
              `INSERT INTO ventas (solicitud_id, visita_id, monto_total_usd, estado_pago, notas)
               VALUES (?, ?, 6500.00, 'anticipo_pagado', 'Venta confirmada caso piloto')`,
              [solId, visitaId]
            );
            const ventaId = resVenta.insertId;

            // Recompensa asociada a la venta (Limpieza anual de paneles - costo empresa $60)
            await conn.query(
              `INSERT INTO recompensas (
                familia_beneficiaria_id, venta_id, tipo_recompensa, descripcion,
                valor_percibido_usd, costo_empresa_usd, estado
              ) VALUES (?, ?, 'limpieza_paneles', 'Limpieza y mantenimiento preventivo anual de paneles', 100.00, 60.00, 'ganada')`,
              [familiaId, ventaId]
            );
          }
        }
      }
    }
    console.log('[SEED] Solicitudes y recompensas de demostración inicializadas con etiqueta "es_simulada = TRUE"');

    await conn.commit();
    console.log('--- Carga de seeds finalizada correctamente ---');
  } catch (error) {
    await conn.rollback();
    console.error('[ERROR en seeds]:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('run-seeds.js')) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

