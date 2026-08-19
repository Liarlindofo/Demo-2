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

/** Normaliza "8:00" / "08:00" → "HH:mm". Null se inválido. */
export function parseHorarioHHmm(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}
