import { DIAS_SEMANA_PT } from '@/lib/tarefas-dias';

export type FolgaFuncionario = {
  diasFolga?: unknown;
  domingoFolga?: string | null;
  ativo?: boolean;
  statusFerias?: string | null;
};

const ABREV_TO_DOW: Record<string, number> = {
  Dom: 0,
  Seg: 1,
  Ter: 2,
  Qua: 3,
  Qui: 4,
  Sex: 5,
  Sáb: 6,
  Sab: 6,
};

/** Converte diasFolga do RH (["Seg","Dom"] ou [0,1]) para set 0–6. */
export function normalizeDiasFolga(raw: unknown): Set<number> {
  const out = new Set<number>();
  if (!Array.isArray(raw)) return out;
  for (const item of raw) {
    if (typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 6) {
      out.add(item);
      continue;
    }
    if (typeof item === 'string') {
      const t = item.trim();
      if (t in ABREV_TO_DOW) {
        out.add(ABREV_TO_DOW[t]);
        continue;
      }
      const n = Number.parseInt(t, 10);
      if (Number.isInteger(n) && n >= 0 && n <= 6) out.add(n);
    }
  }
  return out;
}

function ymdBrasilia(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
}

function weekdayFromYmd(ymd: string): number {
  return new Date(`${ymd}T12:00:00-03:00`).getUTCDay();
}

function sundaySlotInMonth(ymd: string): { nth: number; isLast: boolean } {
  const [y, m, day] = ymd.split('-').map(Number);
  const nth = Math.ceil(day / 7);
  const lastDay = new Date(y, m, 0).getDate();
  return { nth, isLast: day + 7 > lastDay };
}

/**
 * Folga segundo a ficha do RH:
 * - diasFolga fixos (aba Funcionários)
 * - domingoFolga / DSR (1º–4º ou último domingo), se domingo não for folga fixa
 */
export function funcionarioEstaDeFolga(func: FolgaFuncionario, date: Date): boolean {
  if (func.ativo === false) return true;
  if (func.statusFerias === 'gozando') return true;

  const ymd = ymdBrasilia(date);
  const weekday = weekdayFromYmd(ymd);
  const folgas = normalizeDiasFolga(func.diasFolga);

  if (folgas.has(weekday)) return true;

  if (weekday === 0 && func.domingoFolga && !folgas.has(0)) {
    const { nth, isLast } = sundaySlotInMonth(ymd);
    const slot = String(func.domingoFolga);
    if (slot === 'ultimo' && isLast) return true;
    if (slot === String(nth) && nth >= 1 && nth <= 4) return true;
  }

  return false;
}

export function labelFolga(func: FolgaFuncionario): string {
  const dias = [...normalizeDiasFolga(func.diasFolga)]
    .sort((a, b) => a - b)
    .map((d) => DIAS_SEMANA_PT[d]);
  const dsr = func.domingoFolga
    ? func.domingoFolga === 'ultimo'
      ? 'último domingo'
      : `${func.domingoFolga}º domingo`
    : null;
  const parts: string[] = [...dias];
  if (dsr && !dias.includes('Dom')) parts.push(`DSR ${dsr}`);
  return parts.join(', ') || '—';
}
