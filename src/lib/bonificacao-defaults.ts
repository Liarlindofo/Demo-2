export type ModoCalculo = 'PADRAO' | 'MEDIA';

export interface MetricaTemplate {
  id: string;
  nome: string;
  maxPontos: number;
}

export interface DescontoTemplate {
  id: string;
  nome: string;
  /** Pontos descontados quando o desconto está ativo */
  valor: number;
}

export interface FaixaTemplate {
  faixa: number;
  pontosMin: number;
  valorGerente: number;
  valorFuncionario: number;
}

export interface MetricaPlano extends MetricaTemplate {
  pontos: Record<string, number | null>;
}


export interface DescontoPlano {
  id: string;
  nome: string;
  valor: number;
  pontos?: number;
}

export interface DescontoReais {
  valor: number;
  observacao: string;
}

export interface DadosBonificacaoSnapshot {
  modoCalculo: ModoCalculo;
  metricas: MetricaPlano[];
  descontos: DescontoPlano[];
  /** Desconto direto em R$ aplicado ao bônus final (não afeta pontos) */
  descontoReais?: DescontoReais;
  /** Trimestre finalizado/fechado — dados bloqueados para edição */
  fechado?: boolean;
  faixas: FaixaTemplate[];
}

export const DEFAULT_FAIXAS: FaixaTemplate[] = [
  { faixa: 1, pontosMin: 200, valorGerente: 450, valorFuncionario: 100 },
  { faixa: 2, pontosMin: 400, valorGerente: 750, valorFuncionario: 200 },
  { faixa: 3, pontosMin: 600, valorGerente: 1050, valorFuncionario: 300 },
  { faixa: 4, pontosMin: 750, valorGerente: 1350, valorFuncionario: 400 },
  { faixa: 5, pontosMin: 870, valorGerente: 1600, valorFuncionario: 500 },
];

export const DEFAULT_METRICAS: MetricaTemplate[] = [
  { id: 'meta', nome: 'Meta', maxPontos: 40 },
  { id: 'cmv', nome: 'CMV (30%, 5%)', maxPontos: 40 },
  { id: 'ifood', nome: 'iFood (+4.8)', maxPontos: 30 },
  { id: 'cancelamentos', nome: 'Cancelamentos (<0,5%)', maxPontos: 30 },
  { id: 'chargeback', nome: 'Chargeback (<0,1%)', maxPontos: 30 },
  { id: 'motoristas', nome: 'Motoristas (1p a 1%)', maxPontos: 30 },
  { id: 'mao_de_obra', nome: 'Mão de Obra (<5%)', maxPontos: 30 },
  { id: 'google_nota', nome: 'Google Nota 1 (Max 4)', maxPontos: 30 },
  { id: 'turnover', nome: 'Turnover', maxPontos: 30 },
];

export const DEFAULT_DESCONTOS: DescontoTemplate[] = [
  { id: 'lancamento_bnus', nome: 'Lançamentos de boys', valor: 20 },
  { id: 'escala', nome: 'Escala', valor: 20 },
  { id: 'transferencias', nome: 'Transferências', valor: 20 },
  { id: 'contagem', nome: 'Contagem', valor: 20 },
  { id: 'caixa_atrasado', nome: 'Caixa atrasado', valor: 20 },
];

export function defaultTipoPayload(modoCalculo: ModoCalculo = 'PADRAO') {
  return {
    modoCalculo,
    metricas: DEFAULT_METRICAS,
    descontos: DEFAULT_DESCONTOS,
    faixas: DEFAULT_FAIXAS,
  };
}

export function snapshotFromTipo(
  tipo: {
    modoCalculo: string;
    metricas: unknown;
    descontos: unknown;
    faixas: unknown;
  },
  existing?: DadosBonificacaoSnapshot | null,
): DadosBonificacaoSnapshot {
  const existingMetricas = existing?.metricas ?? [];
  const existingDescontos = existing?.descontos ?? [];

  const metricasRaw = Array.isArray(tipo.metricas) ? (tipo.metricas as MetricaTemplate[]) : [];
  const descontosRaw = Array.isArray(tipo.descontos) ? (tipo.descontos as DescontoTemplate[]) : [];

  const metricas = metricasRaw.map(m => {
    const prev = existingMetricas.find(e => e.id === m.id);
    return {
      id: m.id,
      nome: m.nome,
      maxPontos: m.maxPontos,
      pontos: prev?.pontos ?? {},
    };
  });

  const descontos = descontosRaw.map(d => {
    const prev = existingDescontos.find(e => e.id === d.id);
    return {
      id: d.id,
      nome: d.nome,
      valor: prev?.valor ?? 0,
      pontos: d.valor,
    };
  });

  const faixas = normalizeFaixas(tipo.faixas);

  return {
    modoCalculo: (tipo.modoCalculo === 'MEDIA' ? 'MEDIA' : 'PADRAO') as ModoCalculo,
    metricas,
    descontos,
    descontoReais: existing?.descontoReais ?? { valor: 0, observacao: '' },
    fechado: existing?.fechado ?? false,
    faixas,
  };
}

/** Compatibilidade com planos antigos que não tinham faixas no JSON */
export function normalizeFaixas(faixas: unknown): FaixaTemplate[] {
  if (!Array.isArray(faixas) || faixas.length === 0) return DEFAULT_FAIXAS;
  return faixas.map((f, i) => {
    const row = f as Record<string, unknown>;
    return {
      faixa: Number(row.faixa ?? i + 1),
      pontosMin: Number(row.pontosMin ?? row.pontos ?? 0),
      valorGerente: Number(row.valorGerente ?? row.gerente ?? 0),
      valorFuncionario: Number(row.valorFuncionario ?? row.funcionario ?? 0),
    };
  });
}

export function getFaixaFromDados(
  totalLiquido: number,
  faixas: FaixaTemplate[],
): FaixaTemplate | null {
  const sorted = [...faixas].sort((a, b) => a.pontosMin - b.pontosMin);
  let current: FaixaTemplate | null = null;
  for (const f of sorted) {
    if (totalLiquido >= f.pontosMin) current = f;
  }
  return current;
}

export function resolveModoCalculo(dados: unknown): ModoCalculo {
  const d = dados as { modoCalculo?: string } | null;
  return d?.modoCalculo === 'MEDIA' ? 'MEDIA' : 'PADRAO';
}

export function resolveFaixasFromDados(dados: unknown): FaixaTemplate[] {
  const d = dados as { faixas?: unknown } | null;
  return normalizeFaixas(d?.faixas);
}
