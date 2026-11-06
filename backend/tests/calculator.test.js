import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularAhorroVecino } from '../src/validators/schemas.js';
import { CalculadoraService } from '../src/services/calculadoraService.js';

test('Calculadora de ahorro - Caso estándar ($110/mes, 70% ahorro)', () => {
  const res = CalculadoraService.calcular({
    reciboMensual: 110,
    porcentajeAhorro: 0.70,
    costoInstalacion: 6500
  });

  assert.equal(res.recibo_mensual, 110);
  assert.equal(res.ahorro_mensual_estimado, 77); // 110 * 0.70 = 77
  assert.equal(res.ahorro_anual_estimado, 924);  // 77 * 12 = 924
  assert.equal(res.nuevo_recibo_estimado, 33);   // 110 - 77 = 33
  assert.equal(res.recuperacion_anios, 7.0);     // 6500 / 924 = 7.034 -> 7.0 años
  assert.equal(res.etiqueta, 'Estimación');
  assert.equal(res.porcentaje_ahorro, 70);
});

test('Calculadora de ahorro - Manejo seguro de recibo cero sin división por cero', () => {
  const res = CalculadoraService.calcular({
    reciboMensual: 0,
    porcentajeAhorro: 0.70,
    costoInstalacion: 6500
  });

  assert.equal(res.recibo_mensual, 0);
  assert.equal(res.ahorro_mensual_estimado, 0);
  assert.equal(res.ahorro_anual_estimado, 0);
  assert.equal(res.recuperacion_anios, null); // Debe evitar división entre cero
  assert.equal(res.etiqueta, 'Estimación');
});

test('Calculadora de ahorro - Manejo seguro de recibos negativos o inválidos', () => {
  const resNegativo = CalculadoraService.calcular({ reciboMensual: -50 });
  assert.equal(resNegativo.recuperacion_anios, null);
  assert.equal(resNegativo.ahorro_mensual_estimado, 0);

  const resInvalido = CalculadoraService.calcular({ reciboMensual: 'no-es-numero' });
  assert.equal(resInvalido.recuperacion_anios, null);
  assert.equal(resInvalido.ahorro_mensual_estimado, 0);
});

test('Calculadora de ahorro - Caso de alto consumo ($250/mes)', () => {
  const res = CalculadoraService.calcular({
    reciboMensual: 250,
    porcentajeAhorro: 0.70,
    costoInstalacion: 6500
  });

  assert.equal(res.ahorro_mensual_estimado, 175); // 250 * 0.70 = 175
  assert.equal(res.ahorro_anual_estimado, 2100);  // 175 * 12 = 2100
  assert.equal(res.recuperacion_anios, 3.1);     // 6500 / 2100 = 3.095 -> 3.1 años
});

