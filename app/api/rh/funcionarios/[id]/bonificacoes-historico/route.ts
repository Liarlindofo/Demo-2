import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
      select: { id: true },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const ano = new Date().getFullYear();

    const [assiduidade, plrPagamentos, trimestrais] = await Promise.all([
      prisma.rhBonificacaoAssiduidade.findMany({
        where: { funcionarioId: id, ano },
        orderBy: [{ mes: 'desc' }],
      }),
      prisma.rhPLRPagamento.findMany({
        where: { funcionarioId: id, plr: { ano } },
        include: {
          plr: {
            select: {
              id: true,
              trimestre: true,
              ano: true,
              loja: { select: { nome: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rhBonificacaoTrimestral.findMany({
        where: { funcionarioId: id, ano, ativo: true },
        orderBy: [{ trimestre: 'desc' }],
      }),
    ]);

    const totalAno =
      assiduidade.filter((a) => a.recebeu).reduce((s, a) => s + a.valorDireito, 0) +
      plrPagamentos.reduce((s, p) => s + p.valor, 0) +
      trimestrais.reduce((s, t) => s + t.valor, 0);

    return NextResponse.json({
      ano,
      totalAno,
      assiduidade,
      plrs: plrPagamentos.map((p) => ({
        id: p.plr.id,
        trimestre: p.plr.trimestre,
        ano: p.plr.ano,
        valor: p.valor,
        lojaNome: p.plr.loja.nome,
        tipo: 'plr_loja',
      })),
      bonificacoesTrimestrais: trimestrais,
    });
  } catch (err) {
    console.error('[GET bonificacoes-historico]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
