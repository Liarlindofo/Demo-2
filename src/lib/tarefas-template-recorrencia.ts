/**
 * Recorrência padrão do TarefaTemplate (semanal ou mensal).
 * Espelha SlotRecorrencia usado na atribuição / TarefaSerie.
 */

import { DIAS_SEMANA_PT, parseDiasSemana } from '@/lib/tarefas-dias';
import type { SlotRecorrencia } from '@/lib/tarefas-recorrencia';
import { validarRecorrenciaMensal } from '@/lib/tarefas-recorrencia';

export type TemplateRecorrenciaTipo = 'semanal' | 'mensal';
export type TemplateMensalModo = 'dia_do_mes' | 'nth_weekday';
export type TemplateNth = 1 | 2 | 3 | 4 | -1;

export type TemplateRecorrencia = {
  recorrenciaTipo: TemplateRecorrenciaTipo;
  diasSemana: number[];
  mensalModo: TemplateMensalModo | null;
  diaDoMes: number | null;
  nth: TemplateNth | null;
  weekday: number | null;
};

export const NTH_LABELS_PT: { v: TemplateNth; label: string }[] = [
  { v: 1, label: '1ª' },
  { v: 2, label: '2ª' },
  { v: 3, label: '3ª' },
  { v: 4, label: '4ª' },
  { v: -1, label: 'Última' },
];

function parseNth(raw: unknown): TemplateNth | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === -1) return n;
  return null;
}

function parseWeekday(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isInteger(n) || n < 0 || n > 6) return null;
  return n;
}

function parseDiaDoMes(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > 31) return null;
  return n;
}

/**
 * Lê e valida o payload de recorrência do template.
 * Retorna `{ ok: false, error }` ou a shape normalizada para gravar no Prisma.
 */
export function parseTemplateRecorrencia(body: {
  recorrenciaTipo?: unknown;
  diasSemana?: unknown;
  mensalModo?: unknown;
  diaDoMes?: unknown;
  nth?: unknown;
  weekday?: unknown;
}): { ok: true; data: TemplateRecorrencia } | { ok: false; error: string } {
  const tipoRaw = body.recorrenciaTipo;
  const tipo: TemplateRecorrenciaTipo =
    tipoRaw === 'mensal' ? 'mensal' : tipoRaw === 'semanal' || tipoRaw == null || tipoRaw === ''
      ? 'semanal'
      : ('invalid' as TemplateRecorrenciaTipo);

  if (tipo !== 'semanal' && tipo !== 'mensal') {
    return { ok: false, error: 'Tipo de recorrência inválido. Use semanal ou mensal.' };
  }

  if (tipo === 'semanal') {
    const dias = parseDiasSemana(body.diasSemana ?? []);
    if (!dias || dias.length === 0) {
      return {
        ok: false,
        error: 'Selecione pelo menos um dia da semana em que a tarefa deve ser feita.',
      };
    }
    return {
      ok: true,
      data: {
        recorrenciaTipo: 'semanal',
        diasSemana: dias,
        mensalModo: null,
        diaDoMes: null,
        nth: null,
        weekday: null,
      },
    };
  }

  const modo: TemplateMensalModo =
    body.mensalModo === 'nth_weekday' ? 'nth_weekday' : 'dia_do_mes';

  if (modo === 'dia_do_mes') {
    const dia = parseDiaDoMes(body.diaDoMes);
    if (dia == null) {
      return { ok: false, error: 'Informe um dia do mês válido (1–31).' };
    }
    const err = validarRecorrenciaMensal({
      templateId: '_',
      dataBase: '2026-01-01',
      horario: '08:00',
      recorrencia: { tipo: 'mensal', mensalModo: 'dia_do_mes', diaDoMes: dia },
    });
    if (err) return { ok: false, error: err };
    return {
      ok: true,
      data: {
        recorrenciaTipo: 'mensal',
        diasSemana: [],
        mensalModo: 'dia_do_mes',
        diaDoMes: dia,
        nth: null,
        weekday: null,
      },
    };
  }

  const nth = parseNth(body.nth);
  const weekday = parseWeekday(body.weekday);
  if (nth == null) {
    return { ok: false, error: 'Informe a ocorrência do mês (1ª–4ª ou última).' };
  }
  if (weekday == null) {
    return { ok: false, error: 'Selecione o dia da semana para a recorrência mensal.' };
  }
  const err = validarRecorrenciaMensal({
    templateId: '_',
    dataBase: '2026-01-01',
    horario: '08:00',
    recorrencia: { tipo: 'mensal', mensalModo: 'nth_weekday', nth, weekday },
  });
  if (err) return { ok: false, error: err };

  return {
    ok: true,
    data: {
      recorrenciaTipo: 'mensal',
      diasSemana: [],
      mensalModo: 'nth_weekday',
      diaDoMes: null,
      nth,
      weekday,
    },
  };
}

/** Converte campos do template em SlotRecorrencia para gerarDatas / TarefaSerie. */
export function templateToSlotRecorrencia(t: {
  recorrenciaTipo?: string | null;
  diasSemana?: number[] | null;
  mensalModo?: string | null;
  diaDoMes?: number | null;
  nth?: number | null;
  weekday?: number | null;
}): SlotRecorrencia {
  if (t.recorrenciaTipo === 'mensal') {
    const modo = t.mensalModo === 'nth_weekday' ? 'nth_weekday' : 'dia_do_mes';
    if (modo === 'dia_do_mes') {
      return {
        tipo: 'mensal',
        mensalModo: 'dia_do_mes',
        diaDoMes: t.diaDoMes ?? 1,
      };
    }
    const nthRaw = t.nth;
    const nth: TemplateNth =
      nthRaw === 2 || nthRaw === 3 || nthRaw === 4 || nthRaw === -1 ? nthRaw : 1;
    return {
      tipo: 'mensal',
      mensalModo: 'nth_weekday',
      nth,
      weekday: typeof t.weekday === 'number' ? t.weekday : 1,
    };
  }

  return {
    tipo: 'semanal',
    diasSemana: Array.isArray(t.diasSemana) ? t.diasSemana : [],
  };
}

/** Rótulo curto para lista de templates. */
export function formatTemplateRecorrencia(t: {
  recorrenciaTipo?: string | null;
  diasSemana?: number[] | null;
  mensalModo?: string | null;
  diaDoMes?: number | null;
  nth?: number | null;
  weekday?: number | null;
}): string {
  if (t.recorrenciaTipo === 'mensal') {
    if (t.mensalModo === 'nth_weekday') {
      const nthLabel = NTH_LABELS_PT.find((x) => x.v === t.nth)?.label ?? `${t.nth}ª`;
      const dia =
        typeof t.weekday === 'number' && t.weekday >= 0 && t.weekday <= 6
          ? DIAS_SEMANA_PT[t.weekday]
          : '?';
      return `${nthLabel} ${dia} do mês`;
    }
    const dia = t.diaDoMes ?? 1;
    return `Todo dia ${dia} do mês`;
  }

  const dias = Array.isArray(t.diasSemana) ? t.diasSemana : [];
  if (dias.length === 0) return 'Sem dias definidos';
  return dias
    .filter((d) => d >= 0 && d <= 6)
    .map((d) => DIAS_SEMANA_PT[d])
    .join(', ');
}
