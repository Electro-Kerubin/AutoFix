import { normalizarPatente, validarPatente } from './patente';
import { calcularDv, normalizarRut, validarRut } from './rut';

describe('RUT', () => {
  it('normaliza puntos, guion y mayúsculas', () => {
    expect(normalizarRut('12.345.678-5')).toBe('12345678-5');
    expect(normalizarRut('12345678 5')).toBe('12345678-5');
    expect(normalizarRut('7.654.321-k')).toBe('7654321-K');
  });

  it('calcula el dígito verificador (módulo 11)', () => {
    expect(calcularDv('12345678')).toBe('5');
    expect(calcularDv('7654321')).toBe('6');
    expect(calcularDv('11111111')).toBe('1');
    expect(calcularDv('6')).toBe('K');
  });

  it('valida RUT correctos con cualquier formato de entrada', () => {
    expect(validarRut('12.345.678-5')).toBe(true);
    expect(validarRut('123456785')).toBe(true);
    expect(validarRut('7.654.321-6')).toBe(true);
  });

  it('rechaza dígito verificador erróneo, largo inválido o basura', () => {
    expect(validarRut('12.345.678-9')).toBe(false);
    expect(validarRut('1-9')).toBe(false);
    expect(validarRut('abc')).toBe(false);
    expect(validarRut('')).toBe(false);
  });
});

describe('Patente', () => {
  it('normaliza a mayúsculas sin separadores', () => {
    expect(normalizarPatente('bc-df 12')).toBe('BCDF12');
    expect(normalizarPatente('ab.1234')).toBe('AB1234');
  });

  it('acepta formatos chilenos vigentes', () => {
    for (const p of ['BCDF12', 'AB1234', 'ABC12', 'ABC123', 'AB123', 'bc-df-12']) expect(validarPatente(p)).toBe(true);
  });

  it('rechaza formatos que no existen', () => {
    for (const p of ['XX', '123456', 'ABCDEFG', 'A1', '']) expect(validarPatente(p)).toBe(false);
  });
});
