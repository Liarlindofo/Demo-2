/** Utilitários de período aquisitivo de férias (CLT). */

export function addYears(date: Date, years: number): Date {
  const d = new Date(date.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

function toUtcDay(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function sameUtcDay(a: Date, b: Date): boolean {
  return toUtcDay(a) === toUtcDay(b);
}

/** Compara só o dia civil (UTC) — evita flutuação de horário. */
function utcDayMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Novo início aquisitivo após registrar gozo.
 *
 * Usa a admissão (âncora CLT dos aniversários) e avança N períodos enquanto
 * o vencimento (início + 1 ano) for ≤ data de gozo — cobre backfill de vários anos.
 *
 * Se o gozo ocorre ainda no 1º período (antes do 1º vencimento), avança 1 ano
 * (férias gozadas daquele período).
 *
 * Idempotente a partir da admissão + gozo.
 */
export function inicioAquisitivoAposGozo(
  dataGozoFerias: Date,
  opts: {
    dataAdmissao?: Date | null;
    dataInicioFerias?: Date | null;
  },
): Date {
  const base = opts.dataAdmissao ?? opts.dataInicioFerias;
  if (!base) {
    throw new Error('inicioAquisitivoAposGozo requer dataAdmissao ou dataInicioFerias');
  }

  let inicio = new Date(base);
  const gozoMs = utcDayMs(new Date(dataGozoFerias));

  let guard = 0;
  while (utcDayMs(addYears(inicio, 1)) <= gozoMs && guard < 80) {
    inicio = addYears(inicio, 1);
    guard++;
  }

  // Gozo ainda dentro do 1º período aquisitivo (antes do 1º vencimento).
  // Só aplica com âncora de admissão — evita +1 duplicado quando o fallback
  // é um dataInicioFerias já alinhado.
  if (
    guard === 0 &&
    opts.dataAdmissao &&
    sameUtcDay(inicio, new Date(opts.dataAdmissao))
  ) {
    inicio = addYears(inicio, 1);
  }

  return inicio;
}

/**
 * Início efetivo do período aquisitivo atual.
 * Corrige registros legados/atrasados: com gozo salvo, alinha N períodos
 * a partir da admissão (não só +1 ano).
 */
export function inicioAquisitivoEfetivo(
  dataInicioFerias: Date,
  dataAdmissao?: Date | null,
  dataGozoFerias?: Date | null,
): Date {
  const inicio = new Date(dataInicioFerias);
  if (!dataGozoFerias) return inicio;
  if (!dataAdmissao && !dataInicioFerias) return inicio;

  const alinhado = inicioAquisitivoAposGozo(dataGozoFerias, {
    dataAdmissao,
    dataInicioFerias,
  });

  if (!sameUtcDay(alinhado, inicio)) return alinhado;
  return inicio;
}

export interface PeriodoAquisitivo {
  inicio: Date;
  vencimento: Date;
  diasRestantes: number;
  diasDireito: number;
}

export function calcPeriodoAquisitivo(
  dataInicioFerias: Date | null | undefined,
  opts?: {
    dataAdmissao?: Date | null;
    dataGozoFerias?: Date | null;
    hoje?: Date;
  },
): PeriodoAquisitivo | null {
  if (!dataInicioFerias) return null;

  const inicio = inicioAquisitivoEfetivo(
    dataInicioFerias,
    opts?.dataAdmissao,
    opts?.dataGozoFerias,
  );
  const vencimento = addYears(inicio, 1);

  const hoje = opts?.hoje ? new Date(opts.hoje) : new Date();
  const hojeMs = utcDayMs(hoje);
  const vencMs = utcDayMs(vencimento);
  const inicioMs = utcDayMs(inicio);

  const diasRestantes = Math.round((vencMs - hojeMs) / (1000 * 60 * 60 * 24));
  const mesesTrabalhados = Math.floor(
    (hojeMs - inicioMs) / (1000 * 60 * 60 * 24 * 30),
  );
  const diasDireito = Math.min(30, Math.max(0, Math.floor(mesesTrabalhados * 2.5)));

  return { inicio, vencimento, diasRestantes, diasDireito };
}

/** Formata data civil (YYYY-MM-DD em UTC) para pt-BR — evita dia -1 no fuso BR. */
export function formatDateUTC(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/**
 * Ao registrar gozo: avança se for o primeiro registro, ou se for uma
 * nova data de férias posterior à anterior (novo período).
 * @deprecated Preferir sempre reconciliar com inicioAquisitivoAposGozo.
 */
export function deveAvancarPeriodoAoSalvarGozo(
  gozoAnterior: Date | null | undefined,
  gozoNovo: Date | null | undefined,
): boolean {
  if (!gozoNovo) return false;
  if (!gozoAnterior) return true;
  const prev = new Date(gozoAnterior);
  const next = new Date(gozoNovo);
  if (sameUtcDay(prev, next)) return false;
  return next > prev;
}

/** Próximo início aquisitivo após gozar o período atual (+1 ano). */
export function proximoInicioAquisitivo(dataInicioFerias: Date): Date {
  return addYears(new Date(dataInicioFerias), 1);
}
