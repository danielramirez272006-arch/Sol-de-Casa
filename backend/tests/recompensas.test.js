import test from 'node:test';
import assert from 'node:assert/strict';
import { RecompensasService } from '../src/services/recompensasService.js';
import { esTransicionValida } from '../src/validators/schemas.js';

test('Economía de referidos - Fórmulas exactas Parte 2 del caso', () => {
  const eco = RecompensasService.evaluarEconomiaReferidos({
    costoVisita: 60.00,
    tasaCierreVisitas: 0.45,
    costoLimpieza: 60.00,
    maximoPresupuestoCac: 300.00
  });

  // Visitas necesarias por venta: 1 / 0.45 = 2.22
  assert.equal(eco.visitasPorVentaEsperadas, 2.22);

  // Costo esperado de visitas por venta: $60 / 0.45 = $133.33
  assert.equal(eco.costoEsperadoVisitasUsd, 133.33);

  // Costo esperado con una limpieza: $133.33 + $60 = $193.33
  assert.equal(eco.costoEsperadoTotalPorVentaUsd, 193.33);

  // Límite máximo: $300
  assert.equal(eco.limiteMaximoCacUsd, 300.00);

  // Holgura disponible: $300 - $193.33 = $106.67
  assert.equal(eco.margenHolguraUsd, 106.67);
  assert.equal(eco.respetaLimite, true);
});

test('Máquina de estados de solicitudes - Transiciones válidas e inválidas', () => {
  // Transiciones válidas
  assert.equal(esTransicionValida('solicitada', 'agendada'), true);
  assert.equal(esTransicionValida('agendada', 'realizada'), true);
  assert.equal(esTransicionValida('realizada', 'venta_confirmada'), true);
  assert.equal(esTransicionValida('solicitada', 'cancelada'), true);
  assert.equal(esTransicionValida('agendada', 'cancelada'), true);

  // Transiciones inválidas
  assert.equal(esTransicionValida('cancelada', 'venta_confirmada'), false);
  assert.equal(esTransicionValida('venta_confirmada', 'solicitada'), false);
  assert.equal(esTransicionValida('solicitada', 'venta_confirmada'), false); // Debe pasar por agendada/realizada
});

