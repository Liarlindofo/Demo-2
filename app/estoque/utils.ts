/**
 * Formata uma quantidade numérica removendo casas decimais desnecessárias.
 * Limita a 3 casas decimais e elimina zeros à direita.
 * Ex: 3.3333333 → "3.333" | 2.5 → "2.5" | 4.0 → "4"
 */
export function formatQtd(value: number | null, casas = 3): string {
  if (value === null) return '—';
  return parseFloat(value.toFixed(casas)).toString().replace('.', ',');
}
