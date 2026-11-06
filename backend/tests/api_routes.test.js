import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

// Helper ligero para simular solicitudes HTTP en Express sin abrir sockets TCP de red
function testRequest(app, { method = 'GET', url = '/', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    import('node:stream').then(({ Readable }) => {
      const reqStream = new Readable({
        read() {
          if (body) {
            this.push(typeof body === 'string' ? body : JSON.stringify(body));
          }
          this.push(null);
        }
      });

      const req = Object.assign(reqStream, {
        method,
        url,
        originalUrl: url,
        headers: {
          host: '127.0.0.1',
          'content-type': 'application/json',
          ...headers
        },
        body: body && typeof body === 'object' ? body : undefined,
        socket: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1'
      });

      let statusCode = 200;
      let responseHeaders = {};
      let responseBody = '';

      const res = {
        statusCode: 200,
        setHeader(name, val) {
          responseHeaders[name.toLowerCase()] = val;
        },
        getHeader(name) {
          return responseHeaders[name.toLowerCase()];
        },
        status(code) {
          statusCode = code;
          this.statusCode = code;
          return this;
        },
        cookie() {
          return this;
        },
        clearCookie() {
          return this;
        },
        send(chunk) {
          responseBody = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
          resolve({
            status: statusCode,
            headers: responseHeaders,
            json: () => JSON.parse(responseBody),
            text: () => responseBody
          });
          return this;
        },
        json(obj) {
          statusCode = this.statusCode || 200;
          responseHeaders['content-type'] = 'application/json; charset=utf-8';
          resolve({
            status: statusCode,
            headers: responseHeaders,
            json: () => obj,
            text: () => JSON.stringify(obj)
          });
          return this;
        },
        end(chunk) {
          if (chunk) responseBody = chunk.toString();
          resolve({
            status: statusCode,
            headers: responseHeaders,
            json: () => {
              try { return JSON.parse(responseBody); } catch { return null; }
            },
            text: () => responseBody
          });
        }
      };

      try {
        app(req, res, (err) => {
          if (err) reject(err);
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

test('API Express - Healthcheck endpoint', async () => {
  const app = createApp();
  const res = await testRequest(app, { method: 'GET', url: '/api/health' });

  assert.equal(res.status, 200);
  const data = res.json();
  assert.equal(data.ok, true);
  assert.equal(data.servicio, 'Sol de Casa API Backend');
  assert.equal(data.integracionFabricante.estado, 'pendiente_credenciales_api');
});

test('API Express - Endpoint público de calculadora', async () => {
  const app = createApp();
  const res = await testRequest(app, {
    method: 'POST',
    url: '/api/publico/calculadora',
    body: { reciboMensual: 110 }
  });

  assert.equal(res.status, 200);
  const body = res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.recibo_mensual, 110);
  assert.equal(body.data.ahorro_mensual_estimado, 77);
  assert.equal(body.data.ahorro_anual_estimado, 924);
  assert.equal(body.data.recuperacion_anios, 7.0);
  assert.equal(body.data.etiqueta, 'Estimación');
});

test('API Express - Manejo de rutas inexistentes (404 uniforme)', async () => {
  const app = createApp();
  const res = await testRequest(app, { method: 'GET', url: '/api/ruta-que-no-existe' });

  assert.equal(res.status, 404);
  const body = res.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /Ruta no encontrada/);
});
