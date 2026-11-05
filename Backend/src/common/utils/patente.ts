/** Patente en mayúsculas, sin espacios, guiones ni puntos. */
export function normalizarPatente(patente: string): string {
  return patente.replace(/[\s.-]/g, '').toUpperCase();
}

/**
 * Formatos chilenos vigentes: antiguo (AB1234), actual (BCDF12),
 * motos (ABC12 / ABC123) y remolques/otros (AB123).
 */
export function validarPatente(patente: string): boolean {
  return /^([A-Z]{2}\d{4}|[A-Z]{4}\d{2}|[A-Z]{3}\d{2,3}|[A-Z]{2}\d{3})$/.test(normalizarPatente(patente));
}
