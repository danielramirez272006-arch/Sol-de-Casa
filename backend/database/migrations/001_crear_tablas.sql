-- Migración 001: Esquema Inicial de Sol de Casa
-- Tablas con claves foráneas, restricciones de unicidad e índices para consultas rápidas.

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('familia', 'admin') NOT NULL DEFAULT 'familia',
  email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  token_verificacion VARCHAR(100) NULL,
  token_verificacion_expira DATETIME NULL,
  token_recuperacion VARCHAR(100) NULL,
  token_recuperacion_expira DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_rol (rol),
  INDEX idx_usuarios_tokens (token_verificacion, token_recuperacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesiones (
  id VARCHAR(128) PRIMARY KEY,
  usuario_id INT NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_sesiones_usuario (usuario_id),
  INDEX idx_sesiones_expira (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS familias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  nombre_familia VARCHAR(120) NOT NULL,
  titular_nombre VARCHAR(120) NOT NULL,
  telefono VARCHAR(30) NULL,
  colonia VARCHAR(120) NOT NULL,
  direccion TEXT NULL,
  fecha_instalacion DATE NOT NULL,
  capacidad_kw DECIMAL(5,2) NOT NULL DEFAULT 6.00,
  habilitada_referir BOOLEAN NOT NULL DEFAULT TRUE,
  es_simulada BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_familias_simulada (es_simulada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS codigos_referido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familia_id INT NOT NULL UNIQUE,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE,
  INDEX idx_codigos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ahorros_mensuales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  familia_id INT NOT NULL,
  periodo_mes VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
  recibo_anterior_usd DECIMAL(10,2) NOT NULL,
  porcentaje_ahorro DECIMAL(5,4) NOT NULL DEFAULT 0.7000, -- 70%
  ahorro_mes_usd DECIMAL(10,2) NOT NULL,
  recibo_nuevo_usd DECIMAL(10,2) NOT NULL,
  kwh_generados INT NOT NULL DEFAULT 0,
  origen_dato ENUM('real', 'estimado', 'simulado') NOT NULL DEFAULT 'real',
  notas TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_familia_periodo (familia_id, periodo_mes),
  FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE,
  INDEX idx_ahorros_origen (origen_dato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitudes_visita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_referido_id INT NULL,
  nombre_vecino VARCHAR(120) NOT NULL,
  telefono_whatsapp VARCHAR(30) NOT NULL,
  colonia VARCHAR(120) NOT NULL,
  direccion TEXT NULL,
  recibo_luz_usd DECIMAL(10,2) NOT NULL DEFAULT 110.00,
  franja_horaria_preferida VARCHAR(60) NOT NULL DEFAULT 'Mañana (9:00 – 12:00)',
  consentimiento_contacto BOOLEAN NOT NULL DEFAULT TRUE,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  estado ENUM('solicitada', 'agendada', 'realizada', 'venta_confirmada', 'cancelada') NOT NULL DEFAULT 'solicitada',
  es_simulada BOOLEAN NOT NULL DEFAULT FALSE,
  notas_admin TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (codigo_referido_id) REFERENCES codigos_referido(id) ON DELETE SET NULL,
  INDEX idx_solicitudes_estado (estado),
  INDEX idx_solicitudes_referido (codigo_referido_id),
  INDEX idx_solicitudes_simulada (es_simulada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitud_id INT NOT NULL UNIQUE,
  tecnico_asignado VARCHAR(100) NULL,
  fecha_programada DATETIME NULL,
  fecha_realizada DATETIME NULL,
  costo_visita_usd DECIMAL(10,2) NOT NULL DEFAULT 60.00,
  resultado ENUM('pendiente', 'favorable', 'desfavorable', 'cancelada') NOT NULL DEFAULT 'pendiente',
  notas TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes_visita(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitud_id INT NOT NULL UNIQUE,
  monto_contrato_usd DECIMAL(10,2) NOT NULL DEFAULT 6500.00,
  anticipo_50_usd DECIMAL(10,2) NOT NULL DEFAULT 3250.00,
  incluye_bateria BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_firma DATE NOT NULL,
  confirmada_por_usuario_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes_visita(id) ON DELETE RESTRICT,
  FOREIGN KEY (confirmada_por_usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recompensas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL UNIQUE, -- Una sola recompensa por venta (restricción estricta)
  familia_beneficiaria_id INT NOT NULL,
  tipo_recompensa VARCHAR(60) NOT NULL DEFAULT 'limpieza_paneles', -- Propuesta configurable ($60 costo)
  costo_empresa_usd DECIMAL(10,2) NOT NULL DEFAULT 60.00,
  valor_percibido_usd DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  estado ENUM('ganada', 'entregada', 'cancelada') NOT NULL DEFAULT 'ganada',
  fecha_ganada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_entregada DATETIME NULL,
  notas TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE RESTRICT,
  FOREIGN KEY (familia_beneficiaria_id) REFERENCES familias(id) ON DELETE RESTRICT,
  INDEX idx_recompensas_familia (familia_beneficiaria_id),
  INDEX idx_recompensas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eventos_growth (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_evento ENUM('visita_portal', 'intento_compartir_wa', 'enlace_copiado', 'uso_calculadora', 'solicitud_enviada') NOT NULL,
  codigo_referido VARCHAR(32) NULL,
  ip_hash VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  metadata_json JSON NULL,
  es_simulado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_eventos_tipo (tipo_evento),
  INDEX idx_eventos_fecha (created_at),
  INDEX idx_eventos_simulado (es_simulado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(60) NOT NULL,
  entidad_id INT NULL,
  detalles_json JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_audit_usuario (usuario_id),
  INDEX idx_audit_accion (accion),
  INDEX idx_audit_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

