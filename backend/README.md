# Backend de Sol de Casa · Node.js, Express & MySQL

Servidor backend robusto, modular y seguro para la plataforma de referidos solares y gestión de clientes de **Sol de Casa** (Caso C), diseñado conforme a los requerimientos de los PDF Parte 1 y Parte 2.

---

## 1. Arquitectura y Estructura

El backend se encuentra completamente desacoplado del frontend dentro de la carpeta `/backend`:

```
/backend
  /database
    /migrations
      001_crear_tablas.sql        # 10 tablas con FK, índices y restricciones únicas
    /seeds
      run-seeds.js                # Datos iniciales (Familia Gómez, admin, demos simuladas)
    migrate.js                    # Ejecutor determinista de migraciones SQL
  /src
    /config
      db.js                       # Conexión mysql2/promise con pool y transacciones
      env.js                      # Carga y validación estricta de variables de entorno
    /controllers
      adminController.js          # Métricas del panel de Andrés, gestión y auditoría
      authController.js           # Registro, login, logout, verificación y reseteo
      familiasController.js       # Mi ahorro, compartir, mis referidos y telemetría
      publicController.js         # Calculadora de vecinos y recepción de solicitudes
    /middleware
      auth.js                     # Sesiones HttpOnly, roles (admin/familia) y tenencia
      errorHandler.js             # Formato JSON uniforme de errores (sin fugas en prod)
      rateLimiter.js              # Rate limiting estricto anti-fuerza bruta y anti-spam
    /routes
      adminRoutes.js              # Rutas protegidas exclusivas de administrador
      authRoutes.js               # Rutas de autenticación y sesiones
      familiasRoutes.js           # Rutas para familias cliente
      index.js                    # Enrutador principal y endpoint /api/health
      publicRoutes.js             # Rutas públicas (calculadora, invitación, solicitud)
    /services
      ahorroService.js            # Registro mensual, cálculo acumulado y API inversor
      authService.js              # Hashing bcrypt, tokens criptográficos de sesión
      calculadoraService.js       # Ahorro 70%, años recuperación ($6.500) y división segura
      dashboardService.js         # Panel de Andrés, desglose simulado vs real, capacidad
      recompensasService.js       # Transacción atómica venta + recompensa ($60), tope $300
      referidosService.js         # Códigos aleatorios seguros, atribución anti-tampering
      solicitudesService.js       # Máquina de estados, idempotencia y solicitudes
    /validators
      schemas.js                  # Validaciones de email, password, período YYYY-MM
    app.js                        # Configuración de Express, CORS, middlewares y rutas
    server.js                     # Punto de entrada HTTP y cierre ordenado (graceful shutdown)
  /tests
    api_routes.test.js            # Pruebas HTTP de healthcheck, calculadora y 404
    auth_security.test.js         # Pruebas de validación de contraseñas, emails y roles
    calculator.test.js            # Pruebas de fórmulas del 70%, $6.500 y división por cero
    recompensas.test.js           # Pruebas de economía unitaria ($193,33 vs $300) y estados
  .env.example                    # Plantilla documentada de variables de entorno
  .gitignore                      # Exclusiones de Git (node_modules, .env, logs)
  package.json                    # Dependencias y scripts de ejecución
  README.md                       # Documentación técnica completa
```

---

## 2. Requisitos Previos

- **Node.js**: Versión 18.0.0 o superior (compatible con ES Modules nativos).
- **MySQL**: Versión 8.0 o superior (o MariaDB 10.5+).
- **NPM**: Versión 9.0 o superior.

---

## 3. Instalación y Configuración

### Paso 1: Instalar dependencias
Desde la raíz del backend:
```bash
npm install
```

### Paso 2: Configurar variables de entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` con las credenciales de tu servidor MySQL local:
```ini
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Base de datos MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=sol_de_casa_db
DB_CONNECTION_LIMIT=10

# Sesiones seguras
SESSION_SECRET=sol_de_casa_super_secreto_aleatorio_minimo_32_caracteres_1234!
SESSION_COOKIE_NAME=sol_session
SESSION_TTL_DAYS=7

# Correo previsto del Administrador (según directriz del caso)
ADMIN_EMAIL=danielramirez272006@gmail.com
# Opcional para desarrollo local: contraseña inicial del admin
# ADMIN_INITIAL_PASSWORD=AdminSol2026!
```

---

## 4. Base de Datos: Migraciones y Seeds

El backend cuenta con scripts deterministas para crear la base de datos, tablas e insertar los datos iniciales del caso:

### Ejecutar migraciones (creación de base de datos y 10 tablas):
```bash
npm run db:migrate
```

### Ejecutar semillas (seeds de demostración con datos simulados rotulados):
```bash
npm run db:seed
```

El seed crea:
1. **Usuario Administrador:** `danielramirez272006@gmail.com`.
2. **Familia Gómez (Demo):** Recibo histórico de $110, ahorro mensual de $77 (70%), 4 meses registrados ($308 acumulados) rotulados como `simulado`.
3. **Código de referido:** `GOMEZ70SOL`.
4. **Solicitudes y Recompensas Demo:** 3 vecinos en distintas fases del embudo para alimentar el Panel de Andrés.

---

## 5. Ejecución del Servidor

### Modo desarrollo (con recarga automática):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor estará escuchando en `http://localhost:3001`. Puedes verificar el estado en:
`http://localhost:3001/api/health`

---

## 6. Pruebas Automatizadas

El proyecto utiliza el test runner nativo de Node.js (`node --test`), sin requerir librerías externas de testing:

```bash
npm test
```

### Cobertura de las pruebas:
- **`calculator.test.js`**: Fórmulas de ahorro 70% ($110 → $77), ahorro anual ($924), años de recuperación ($6.500 / $924 = 7.0 años), manejo seguro de recibo cero sin división por cero, casos de alto consumo y preservación de etiqueta `"Estimación"`.
- **`recompensas.test.js`**: Fórmulas exactas de la Parte 2:
  - Visitas por venta referida: $1 \div 0,45 = 2,22$ visitas.
  - Costo esperado de visitas: $\$60 \div 0,45 = \$133,33$.
  - Costo total con limpieza: $\$133,33 + \$60 = \$193,33$.
  - Límite máximo: $\$300$.
  - Margen de holgura: $\$106,67$.
  - Máquina de estados: `solicitada` → `agendada` → `realizada` → `venta_confirmada` / `cancelada`.
- **`auth_security.test.js`**: Validación de correo, complejidad de contraseñas, formato de período `YYYY-MM` y montos positivos.
- **`api_routes.test.js`**: Verificación de endpoints Express (`/api/health`, `/api/publico/calculadora` y respuestas `404`).

---

## 7. Contrato de la API REST

### Endpoints Públicos

| Método | Endpoint | Descripción | Body / Parámetros |
|---|---|---|---|
| `GET` | `/api/health` | Estado del servicio y conexión a MySQL | Ninguno |
| `POST` | `/api/publico/calculadora` | Estimación de ahorro y recuperación simple | `{ "reciboMensual": 110 }` |
| `GET` | `/api/publico/invitacion/:codigo` | Datos mínimos públicos de la invitación | `:codigo` (ej: `GOMEZ70SOL`) |
| `POST` | `/api/publico/solicitudes` | Solicitud de visita técnica del vecino | `{ "codigoReferido", "nombreVecino", "telefono", "reciboActualUsd", "horarioPreferencia", "consentimientoContacto": true, "idempotencyKey" }` |

### Autenticación y Cuentas (`/api/auth`)

| Método | Endpoint | Descripción | Seguridad |
|---|---|---|---|
| `POST` | `/api/auth/registro` | Registro público de familia (no permite elegir admin) | Rate limit estricto |
| `GET` | `/api/auth/verificar-email` | Verificación de correo con token de 24 h | Token de verificación |
| `POST` | `/api/auth/login` | Inicio de sesión, devuelve cookie `HttpOnly` | Bcrypt + Rate limit |
| `POST` | `/api/auth/logout` | Cierre de sesión e invalidación en base de datos | Cookie `sol_session` |
| `POST` | `/api/auth/recuperar-password` | Solicitud de token de recuperación (1 h) | Rate limit anti-enumeración |
| `POST` | `/api/auth/reset-password` | Cambio de contraseña con token | Token de un solo uso |
| `GET` | `/api/auth/perfil` | Datos del usuario autenticado | Sesión activa |

### Endpoints de Familias (`/api/familias`) - Requiere rol `familia` o `admin`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/familias/mi-ahorro` | Ahorro del mes, acumulado, etiqueta simulada e integraciones pendientes |
| `GET` | `/api/familias/compartir` | Código personal, enlace y plantilla de WhatsApp |
| `GET` | `/api/familias/mis-referidos` | Avance de vecinos invitados, recompensas ganadas y tabla de premios |
| `POST` | `/api/familias/telemetria` | Registro de eventos (tarjeta compartida, link copiado) |

### Endpoints de Administración (`/api/admin`) - Requiere rol `admin`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/admin/resumen` | Resumen del panel de Andrés: funnel, capacidad vs demanda y CAC real |
| `GET` | `/api/admin/solicitudes` | Lista y filtro de solicitudes de visitas |
| `PATCH` | `/api/admin/solicitudes/:id/estado` | Cambio de estado según máquina de estados |
| `POST` | `/api/admin/ventas/confirmar` | **Transacción atómica:** confirma venta y asigna recompensa de limpieza ($60) |
| `PATCH` | `/api/admin/recompensas/:id/estado` | Actualiza estado de recompensa (`ganada` → `entregada`) |
| `POST` | `/api/admin/ahorros` | Carga o corrección de registros mensuales de ahorro |
| `GET` | `/api/admin/familias` | Lista de familias y códigos de referido activos |

---

## 8. Seguridad y Control de Acceso

1. **Sesiones con Cookies HttpOnly:**
   - Protegidas contra ataques XSS mediante `HttpOnly`.
   - `SameSite=Lax` para protección contra CSRF.
   - Atributo `Secure` habilitado automáticamente en entornos de producción (`NODE_ENV=production`).
2. **Contraseñas Seguras:**
   - Hasheadas con `bcryptjs` usando un factor de costo de 12 rondas.
   - La directriz prohíbe explícitamente contraseñas en texto plano o inventadas en el código fuente.
3. **Control de Roles y Tenencia:**
   - Los roles permitidos son `admin` y `familia`.
   - El registro público asigna obligatoriamente el rol `familia`.
   - El middleware `aislarFamilia` garantiza que una familia únicamente pueda consultar y modificar sus propios datos.
4. **Idempotencia y Anti-Duplicados:**
   - La tabla `solicitudes_visita` cuenta con un campo único `idempotency_key` para evitar solicitudes duplicadas causadas por dobles clics o reintentos del usuario.
   - La tabla `recompensas` cuenta con una restricción única `UNIQUE KEY (venta_id)`, impidiendo que una venta genere más de una recompensa incluso bajo condiciones de carrera.
5. **Transacciones ACID:**
   - La confirmación de ventas y asignación de recompensas se ejecuta dentro de transacciones de MySQL (`BEGIN` ... `COMMIT`/`ROLLBACK`).

---

## 9. Parámetros Económicos del Caso

- **Precio de instalación estándar:** $\$6.500$.
- **Porcentaje de ahorro mensual:** $70\%$.
- **Costo de visita técnica:** $\$60$.
- **Tasa de cierre de visitas referidas:** $45\%$.
- **Costo esperado de visitas por venta:** $\$60 \div 0,45 = \$133,33$.
- **Propuesta de recompensa:** Limpieza anual de paneles (costo empresa $\$60$, valor percibido $\$100$).
- **Costo total esperado por venta referida:** $\$133,33 + \$60 = \$193,33$.
- **Tope máximo fijado por el caso:** $\$300$ por venta referida.
- **Capacidad base de visitas:** $100$ visitas/mes ($+50$ visitas por cada técnico adicional contratado).

---

## 10. Conexión con el Frontend

El frontend ubicado en `sol-de-casa/web/` y compilado en `entregables/Sol_de_Casa_tablero.html` detecta automáticamente la disponibilidad del backend en `http://localhost:3001/api`.

- **Si el backend está encendido:** Sincroniza las solicitudes directamente en la base de datos MySQL, asigna números de folio reales y refleja el estado en el indicador de estado del recorrido (`● Backend + MySQL activo`).
- **Si el backend está apagado:** El frontend activa su modo de simulación autónomo interactivo, permitiendo al evaluador explorar las 5 vistas y animaciones sin interrupciones ni fallos de red.

