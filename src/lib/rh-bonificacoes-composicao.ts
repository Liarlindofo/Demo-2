import { prisma } from '@/lib/prisma';
import {
  calcularBonificacoesComposicao,
  type BonificacoesComposicaoMes,
} from '@/lib/calculos-rh';

export function trimestreDoMes(mes: number): number {
  return Math.ceil(mes / 3);
}

export async function carregarBonificacoesComposicao(
  funcionarioId: string,
  ref: Date = new Date()
): Promise<BonificacoesComposicaoMes> {
  const mes = ref.getMonth() + 1;
  const ano = ref.getFullYear();
  const trimestre = trimestreDoMes(mes);

  const [assiduidadeMes, plrPagamento, trimestrais] = await Promise.all([
    prisma.rhBonificacaoAssiduidade.findUnique({
      where: { funcionarioId_mes_ano: { funcionarioId, mes, ano } },
    }),
    prisma.rhPLRPagamento.findFirst({
      where: {
        funcionarioId,
        plr: { trimestre, ano },
      },
      select: { valor: true },
    }),
    prisma.rhBonificacaoTrimestral.findMany({
      where: { funcionarioId, ano, ativo: true },
      select: { valor: true, ativo: true },
    }),
  ]);

  return calcularBonificacoesComposicao({
    mes,
    ano,
    trimestre,
    assiduidadeMes: assiduidadeMes
      ? { recebeu: assiduidadeMes.recebeu, valorDireito: assiduidadeMes.valorDireito }
      : null,
    plrValorTrimestre: plrPagamento?.valor ?? null,
    trimestrais,
  });
}
