import test from 'node:test';
import assert from 'node:assert/strict';
import { validarEmail, validarPassword, validarPeriodo, validarNumeroPositivo } from '../src/validators/schemas.js';

test('Validadores de seguridad - Email', () => {
  assert.equal(validarEmail('familia@ejemplo.com'), true);
  assert.equal(validarEmail('danielramirez272006@gmail.com'), true);
  assert.equal(validarEmail('invalido'), false);
  assert.equal(validarEmail('@sin-usuario.com'), false);
  assert.equal(validarEmail('espacios en blanco@ejemplo.com'), false);
});

test('Validadores de seguridad - Contraseña (mínimo 8 caracteres con letras y números)', () => {
  assert.equal(validarPassword('SolCasa2026!'), true);
  assert.equal(validarPassword('corta1'), false);       // Menos de 8 caracteres
  assert.equal(validarPassword('solamentoletras'), false); // Sin números
  assert.equal(validarPassword('1234567890'), false);      // Sin letras
});

test('Validadores de base de datos - Período YYYY-MM', () => {
  assert.equal(validarPeriodo('2026-04'), true);
  assert.equal(validarPeriodo('2026-12'), true);
  assert.equal(validarPeriodo('2026-13'), false); // Mes inválido
  assert.equal(validarPeriodo('2026-00'), false); // Mes inválido
  assert.equal(validarPeriodo('26-04'), false);
  assert.equal(validarPeriodo('2026/04'), false);
});

test('Validadores numéricos - Montos positivos', () => {
  assert.equal(validarNumeroPositivo(110.00), true);
  assert.equal(validarNumeroPositivo(0, true), true);   // Permitiendo cero
  assert.equal(validarNumeroPositivo(0, false), false); // Estrictamente positivo
  assert.equal(validarNumeroPositivo(-10), false);
  assert.equal(validarNumeroPositivo('abc'), false);
});

