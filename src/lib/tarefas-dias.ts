/** 0 = domingo … 6 = sábado (mesmo índice de Date#getDay). */
export const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

/** Normaliza e valida `diasSemana`. Retorna null se o payload for inválido. */
export function parseDiasSemana(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) return null;
  const set = new Set<number>();
  for (const n of raw) {
    const v = typeof n === 'number' ? n : typeof n === 'string' ? Number.parseInt(n, 10) : NaN;
    if (!Number.isInteger(v) || v < 0 || v > 6) return null;
    set.add(v);
  }
  return [...set].sort((a, b) => a - b);
}

export function formatDiasSemana(dias: number[]): string {
  return dias
    .filter((d) => d >= 0 && d <= 6)
    .map((d) => DIAS_SEMANA_PT[d])
    .join(', ');
}
