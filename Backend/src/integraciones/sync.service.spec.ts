import { esperaMinutos } from './sync.service';

describe('reintentos de sincronización', () => {
  it('espera de forma exponencial con tope de 60 minutos', () => {
    expect([1, 2, 3, 4, 5, 6].map(esperaMinutos)).toEqual([1, 2, 4, 8, 16, 32]);
    expect(esperaMinutos(10)).toBe(60);
  });
});
