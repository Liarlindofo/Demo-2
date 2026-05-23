export interface ComposicaoSalarial {
  salarioBase: number;
  adicionalResponsabilidade: number;
  bonificacaoAssiduidade: number;
  valorAlimentacao: number;
  valorVT: number;
  baseCalculoEncargos: number;
  totalBruto: number;
}

export interface EncargosPatronais {
  inssPatronal: number;
  fgts: number;
  rat: number;
  sistemaS: number;
  totalEncargos: number;
  custoTotal: number;
  custoTotalEmpresa: number;
  percentualSobreSalario: number;
  percentualSobreBase: number;
}

export function calcularComposicaoSalarial(funcionario: {
  salarioBase: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
  valorAlimentacao: number;
  valorVT: number;
}): ComposicaoSalarial {
  const adicionalResponsabilidade = funcionario.cargoResponsabilidade
    ? funcionario.salarioBase * 0.4
    : 0;

  const baseCalculoEncargos =
    funcionario.salarioBase +
    adicionalResponsabilidade +
    funcionario.bonificacaoAssiduidade;

  const totalBruto =
    baseCalculoEncargos +
    funcionario.valorAlimentacao +
    funcionario.valorVT;

  return {
    salarioBase: funcionario.salarioBase,
    adicionalResponsabilidade,
    bonificacaoAssiduidade: funcionario.bonificacaoAssiduidade,
    valorAlimentacao: funcionario.valorAlimentacao,
    valorVT: funcionario.valorVT,
    baseCalculoEncargos,
    totalBruto,
  };
}

/** Encargos incidem apenas sobre baseCalculoEncargos (não VT/VR) */
export function calcularEncargosPatronais(
  baseCalculoEncargos: number,
  rat: number = 2,
  fap: number = 1.0
): EncargosPatronais {
  if (baseCalculoEncargos <= 0) {
    return {
      inssPatronal: 0,
      fgts: 0,
      rat: 0,
      sistemaS: 0,
      totalEncargos: 0,
      custoTotal: 0,
      custoTotalEmpresa: 0,
      percentualSobreSalario: 0,
      percentualSobreBase: 0,
    };
  }

  const inssPatronal = baseCalculoEncargos * 0.2;
  const fgts = baseCalculoEncargos * 0.08;
  const ratAjustado = baseCalculoEncargos * (rat / 100) * fap;
  const senac = baseCalculoEncargos * 0.01;
  const sesc = baseCalculoEncargos * 0.015;
  const sebrae = baseCalculoEncargos * 0.006;
  const incra = baseCalculoEncargos * 0.002;
  const salarioEducacao = baseCalculoEncargos * 0.025;

  const sistemaS = senac + sesc + sebrae + incra + salarioEducacao;
  const totalEncargos = inssPatronal + fgts + ratAjustado + sistemaS;
  const custoTotalEmpresa = baseCalculoEncargos + totalEncargos;

  return {
    inssPatronal,
    fgts,
    rat: ratAjustado,
    sistemaS,
    totalEncargos,
    custoTotal: custoTotalEmpresa,
    custoTotalEmpresa,
    percentualSobreSalario: (totalEncargos / baseCalculoEncargos) * 100,
    percentualSobreBase: (totalEncargos / baseCalculoEncargos) * 100,
  };
}

/** Custo anualizado: mensal × 13,33 (12 meses + 13º + férias proporcionais) */
export const FATOR_ANUAL = 14.33;

export function custoAnualizado(custoMensal: number): number {
  return custoMensal * FATOR_ANUAL;
}

/** Projeção mensal média de bonificações trimestrais (soma anual / 12) */
export function mediaMensalBonificacoesTrimestrais(
  bonificacoes: { valor: number; ativo?: boolean }[]
): number {
  const ativas = bonificacoes.filter((b) => b.ativo !== false);
  if (ativas.length === 0) return 0;
  const soma = ativas.reduce((s, b) => s + b.valor, 0);
  return soma / 12;
}

/** PLR trimestral rateado em 3 meses do trimestre */
export function plrProjetadoMensal(valorTrimestre: number | null | undefined): number {
  if (!valorTrimestre || valorTrimestre <= 0) return 0;
  return valorTrimestre / 3;
}

export interface BonificacoesComposicaoMes {
  mes: number;
  ano: number;
  trimestre: number;
  assiduidadePrograma: number;
  plrProjetadoMensal: number;
  bonificacaoTrimestralMedia: number;
  totalVariavel: number;
}

export function calcularBonificacoesComposicao(input: {
  mes: number;
  ano: number;
  trimestre: number;
  assiduidadeMes?: { recebeu: boolean; valorDireito: number } | null;
  plrValorTrimestre?: number | null;
  trimestrais?: { valor: number; ativo?: boolean }[];
}): BonificacoesComposicaoMes {
  const assiduidadePrograma =
    input.assiduidadeMes?.recebeu === true ? input.assiduidadeMes.valorDireito : 0;
  const plrProjetado = plrProjetadoMensal(input.plrValorTrimestre);
  const bonificacaoTrimestralMedia = mediaMensalBonificacoesTrimestrais(
    input.trimestrais ?? []
  );
  const totalVariavel =
    assiduidadePrograma + plrProjetado + bonificacaoTrimestralMedia;

  return {
    mes: input.mes,
    ano: input.ano,
    trimestre: input.trimestre,
    assiduidadePrograma,
    plrProjetadoMensal: plrProjetado,
    bonificacaoTrimestralMedia,
    totalVariavel,
  };
}

export function totalBrutoComBonificacoes(
  composicao: ComposicaoSalarial,
  bonificacoes: BonificacoesComposicaoMes
): number {
  return composicao.totalBruto + bonificacoes.totalVariavel;
}

export function custoMensalEmpresaComBonificacoes(
  composicao: ComposicaoSalarial,
  encargosTotal: number,
  bonificacoes: BonificacoesComposicaoMes
): number {
  return (
    composicao.baseCalculoEncargos +
    encargosTotal +
    composicao.valorAlimentacao +
    composicao.valorVT +
    bonificacoes.totalVariavel
  );
}
