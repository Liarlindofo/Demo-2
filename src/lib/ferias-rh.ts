/** Utilitários de período aquisitivo de férias (CLT). */

export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function toUtcDay(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function sameUtcDay(a: Date, b: Date): boolean {
  return toUtcDay(a) === toUtcDay(b);
}

/**
 * Início efetivo do período aquisitivo atual.
 * Corrige registros legados: gozo salvo sem avançar dataInicioFerias
 * (ainda igual à admissão).
 */
export function inicioAquisitivoEfetivo(
  dataInicioFerias: Date,
  dataAdmissao?: Date | null,
  dataGozoFerias?: Date | null,
): Date {
  const inicio = new Date(dataInicioFerias);
  if (
    dataGozoFerias &&
    dataAdmissao &&
    sameUtcDay(inicio, new Date(dataAdmissao))
  ) {
    return addYears(inicio, 1);
  }
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
  hoje.setHours(0, 0, 0, 0);
  const vencDay = new Date(vencimento);
  vencDay.setHours(0, 0, 0, 0);

  const diasRestantes = Math.floor(
    (vencDay.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );
  const mesesTrabalhados = Math.floor(
    (hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30),
  );
  const diasDireito = Math.min(30, Math.max(0, Math.floor(mesesTrabalhados * 2.5)));

  return { inicio, vencimento, diasRestantes, diasDireito };
}

/**
 * Ao registrar gozo: avança se for o primeiro registro, ou se for uma
 * nova data de férias posterior à anterior (novo período).
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

/** Próximo início aquisitivo após gozar o período atual. */
export function proximoInicioAquisitivo(dataInicioFerias: Date): Date {
  return addYears(new Date(dataInicioFerias), 1);
}
