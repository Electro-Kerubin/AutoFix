/** Deja el RUT en formato canónico "12345678-5" (sin puntos, DV en mayúscula). */
export function normalizarRut(rut: string): string {
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

/** Calcula el dígito verificador (módulo 11) de la parte numérica del RUT. */
export function calcularDv(cuerpo: string): string {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

export function validarRut(rut: string): boolean {
  const normalizado = normalizarRut(rut);
  const match = /^(\d{7,8})-([0-9K])$/.exec(normalizado);
  if (!match) return false;
  return calcularDv(match[1]) === match[2];
}
