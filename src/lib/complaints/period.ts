/** Fuso fixo America/Sao_Paulo (UTC−3; Brasil sem horário de verão desde 2019). */
const SP_OFFSET = '-03:00';

export type MonthPeriod = {
  year: number;
  month: number; // 1–12
  start: Date;
  end: Date;
};

/** Partes ano/mês/dia no fuso de São Paulo. */
export function saoPauloYmd(date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Mês civil completo em America/Sao_Paulo (dia 1 00:00 → último dia 23:59:59.999). */
export function monthPeriod(year: number, month: number): MonthPeriod {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error('year inválido.');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('month inválido (1–12).');
  }

  const mm = String(month).padStart(2, '0');
  const start = new Date(`${year}-${mm}-01T00:00:00.000${SP_OFFSET}`);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nm = String(nextMonth).padStart(2, '0');
  const end = new Date(new Date(`${nextYear}-${nm}-01T00:00:00.000${SP_OFFSET}`).getTime() - 1);

  return { year, month, start, end };
}

/** Mês anterior completo relativo a `now` em São Paulo. */
export function previousMonthPeriod(now = new Date()): MonthPeriod {
  const { year, month } = saoPauloYmd(now);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return monthPeriod(prevYear, prevMonth);
}

/** Mês civil atual (pode estar incompleto) — útil pra testar o pipeline. */
export function currentMonthPeriod(now = new Date()): MonthPeriod {
  const { year, month } = saoPauloYmd(now);
  return monthPeriod(year, month);
}
