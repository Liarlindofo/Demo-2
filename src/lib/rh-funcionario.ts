import {
  calcularComposicaoSalarial,
  calcularEncargosPatronais,
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
  fap?: number
) {
  const composicaoSalarial = calcularComposicaoSalarial(funcionario);
  const encargosPatronais =
    ratPct !== undefined
      ? calcularEncargosPatronais(composicaoSalarial.baseCalculoEncargos, ratPct, fap ?? 1)
      : undefined;

  return {
    ...funcionario,
    composicaoSalarial,
    salarioBruto: composicaoSalarial.totalBruto,
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
