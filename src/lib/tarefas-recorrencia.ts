export const HORIZON_DIAS = 90;

export interface SlotRecorrencia {
  tipo?: 'unica' | 'diaria' | 'semanal' | 'mensal';
  diasSemana?: number[];
  dataFim?: string;
  mensalModo?: 'dia_do_mes' | 'nth_weekday';
  diaDoMes?: number;
  nth?: 1 | 2 | 3 | 4 | -1;
  weekday?: number;
}

export interface SlotInput {
  templateId: string;
  dataBase: string;
  horario: string;
  lojaExecucaoId?: string;
  recorrencia?: SlotRecorrencia;
}

function ultimoDiaDoMes(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function diaDoMesNoMes(year: number, month: number, diaDoMes: number): string {
  const last = ultimoDiaDoMes(year, month);
  const day = Math.min(Math.max(1, diaDoMes), last);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function nthWeekdayNoMes(
  year: number,
  month: number,
  nth: number,
  weekday: number,
): string | null {
  if (nth === -1) {
    const lastDay = ultimoDiaDoMes(year, month);
    for (let day = lastDay; day >= 1; day--) {
      const d = new Date(Date.UTC(year, month - 1, day));
      if (d.getUTCDay() === weekday) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }

  let count = 0;
  const lastDay = ultimoDiaDoMes(year, month);
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCDay() === weekday) {
      count++;
      if (count === nth) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

function parseYm(dateStr: string): { year: number; month: number } {
  const [y, m] = dateStr.split('-').map(Number);
  return { year: y, month: m };
}

function addMonthsYm(year: number, month: number, n: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + n;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function ymdBrasilia(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
}

export function addDaysYmd(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00-03:00`);
  d.setTime(d.getTime() + n * 24 * 60 * 60 * 1000);
  return ymdBrasilia(d);
}

/**
 * Gera os instantes UTC para cada ocorrência do slot.
 * dataBase e horario são America/Sao_Paulo (UTC-3 fixo).
 * Sem dataFim, materializa no máximo HORIZON_DIAS a partir de dataBase.
 */
export function gerarDatas(slot: SlotInput): Date[] {
  const tipo = slot.recorrencia?.tipo ?? 'unica';

  if (tipo === 'unica') {
    return [new Date(`${slot.dataBase}T${slot.horario}:00-03:00`)];
  }

  const dataInicioMs = new Date(`${slot.dataBase}T00:00:00-03:00`).getTime();
  const dataFimStr = slot.recorrencia?.dataFim;
  const dataFimBaseMs = dataFimStr
    ? new Date(`${dataFimStr}T23:59:59.999-03:00`).getTime()
    : null;
  const maxMs = dataInicioMs + HORIZON_DIAS * 24 * 60 * 60 * 1000;
  const efetiveFimMs =
    dataFimBaseMs !== null && dataFimBaseMs < maxMs ? dataFimBaseMs : maxMs;

  if (tipo === 'mensal') {
    const modo = slot.recorrencia?.mensalModo ?? 'dia_do_mes';
    const datas: Date[] = [];
    let { year, month } = parseYm(slot.dataBase);
    const fimDateStr = ymdBrasilia(new Date(efetiveFimMs));
    const fimYm = parseYm(fimDateStr);

    while (year < fimYm.year || (year === fimYm.year && month <= fimYm.month)) {
      let dateStr: string | null = null;
      if (modo === 'dia_do_mes') {
        const dia = slot.recorrencia?.diaDoMes ?? 1;
        dateStr = diaDoMesNoMes(year, month, dia);
      } else {
        const nth = slot.recorrencia?.nth ?? 1;
        const weekday = slot.recorrencia?.weekday ?? 1;
        dateStr = nthWeekdayNoMes(year, month, nth, weekday);
      }

      if (dateStr) {
        const d = new Date(`${dateStr}T${slot.horario}:00-03:00`);
        const ms = d.getTime();
        if (ms >= dataInicioMs && ms <= efetiveFimMs) {
          datas.push(d);
        }
      }

      ({ year, month } = addMonthsYm(year, month, 1));
    }

    return datas;
  }

  const diasSemana = slot.recorrencia?.diasSemana ?? [];
  const datas: Date[] = [];
  let currentMs = dataInicioMs;
  while (currentMs <= efetiveFimMs) {
    const dateStrBRT = new Date(currentMs).toISOString().slice(0, 10);
    const d = new Date(`${dateStrBRT}T${slot.horario}:00-03:00`);
    const dow = d.getUTCDay();
    if (tipo === 'diaria' || (tipo === 'semanal' && diasSemana.includes(dow))) {
      datas.push(d);
    }
    currentMs += 24 * 60 * 60 * 1000;
  }

  return datas;
}

export function validarRecorrenciaMensal(slot: SlotInput): string | null {
  const rec = slot.recorrencia;
  if (!rec || rec.tipo !== 'mensal') return null;

  const modo = rec.mensalModo ?? 'dia_do_mes';
  if (modo === 'dia_do_mes') {
    const dia = rec.diaDoMes;
    if (typeof dia !== 'number' || !Number.isInteger(dia) || dia < 1 || dia > 31) {
      return 'Informe um dia do mês válido (1–31) para a recorrência mensal.';
    }
    return null;
  }

  if (modo === 'nth_weekday') {
    const nth = rec.nth;
    const weekday = rec.weekday;
    if (nth !== 1 && nth !== 2 && nth !== 3 && nth !== 4 && nth !== -1) {
      return 'Informe a ocorrência do mês (1ª–4ª ou última).';
    }
    if (typeof weekday !== 'number' || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return 'Selecione o dia da semana para a recorrência mensal.';
    }
    return null;
  }

  return 'Modo de recorrência mensal inválido.';
}

/** Recorrência aberta: gera 90 dias agora e o cron renova. */
export function isSerieAberta(rec: SlotRecorrencia | undefined): boolean {
  if (!rec) return false;
  const tipo = rec.tipo ?? 'unica';
  if (tipo === 'unica') return false;
  return !rec.dataFim;
}
