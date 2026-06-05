import {
  calcularComposicaoSalarial,
  calcularEncargosPatronais,
  custoMensalEmpresaComBonificacoes,
  totalBrutoComBonificacoes,
  type BonificacoesComposicaoMes,
  type ComposicaoSalarial,
} from '@/lib/calculos-rh';

export type CamposComposicaoSalarial = {
  salarioBase: number;
  valorAlimentacao: number;
  valorVT: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
};

export function enrichFuncionario<T extends CamposComposicaoSalarial>(
  funcionario: T,
  ratPct?: number,
  fap?: number,
  bonificacoesComposicao?: BonificacoesComposicaoMes
) {
  const f = funcionario as unknown as Record<string, unknown>;
  const normalized = {
    ...funcionario,
    escala: (f.escala as string | null | undefined) ?? '6x1',
    turno: (f.turno as string | null | undefined) ?? 'manhã',
    diasFolga: Array.isArray(f.diasFolga) ? f.diasFolga : [],
  } as unknown as T;
  const composicaoSalarial = calcularComposicaoSalarial(normalized);
  const encargosPatronais =
    ratPct !== undefined
      ? calcularEncargosPatronais(composicaoSalarial.baseCalculoEncargos, ratPct, fap ?? 1)
      : undefined;

  const salarioBruto = bonificacoesComposicao
    ? totalBrutoComBonificacoes(composicaoSalarial, bonificacoesComposicao)
    : composicaoSalarial.totalBruto;

  const custoMensalTotal =
    bonificacoesComposicao && encargosPatronais
      ? custoMensalEmpresaComBonificacoes(
          composicaoSalarial,
          encargosPatronais.totalEncargos,
          bonificacoesComposicao
        )
      : undefined;

  return {
    ...normalized,
    composicaoSalarial,
    salarioBruto,
    ...(bonificacoesComposicao ? { bonificacoesComposicao } : {}),
    ...(custoMensalTotal !== undefined ? { custoMensalTotal } : {}),
    ...(encargosPatronais ? { encargosPatronais } : {}),
  };
}

export function enrichFuncionarios<T extends CamposComposicaoSalarial & { cargo?: { ratPct: number } }>(
  funcionarios: T[],
  fapPorLoja?: Record<string, number>
) {
  return funcionarios.map((f) => {
    const rat = f.cargo?.ratPct ?? 2;
    const fap = fapPorLoja?.[(f as { lojaId?: string }).lojaId ?? ''] ?? 1;
    return enrichFuncionario(f, rat, fap);
  });
}

export function formatComposicaoHistorico(composicao: ComposicaoSalarial): string {
  return `R$ ${composicao.totalBruto.toFixed(2)} (base encargos: R$ ${composicao.baseCalculoEncargos.toFixed(2)})`;
}

export const CAMPOS_COMPOSICAO_HISTORICO = [
  'salarioBase',
  'cargoResponsabilidade',
  'bonificacaoAssiduidade',
  'valorAlimentacao',
  'valorVT',
] as const;
