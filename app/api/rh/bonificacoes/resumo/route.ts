import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { mesAnoAtual, trimestreAtual, seedAssiduidadeMes } from '@/lib/seed-assiduidade';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { mes, ano } = mesAnoAtual();
    const trimestre = trimestreAtual();

    const countAssid = await prisma.rhBonificacaoAssiduidade.count({
      where: { mes, ano, funcionario: { userId: dbUser.id, ativo: true } },
    });
    if (countAssid === 0) {
      await seedAssiduidadeMes(dbUser.id, mes, ano);
    }

    const [registros, plrsTrimestre] = await Promise.all([
      prisma.rhBonificacaoAssiduidade.findMany({
        where: { mes, ano, funcionario: { userId: dbUser.id, ativo: true } },
        select: { recebeu: true },
      }),
      prisma.rhPLRTrimestral.count({
        where: {
          ano,
          trimestre,
          loja: { userId: dbUser.id },
        },
      }),
    ]);

    const MESES = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    return NextResponse.json({
      mes,
      ano,
      mesLabel: MESES[mes],
      trimestre,
      comAssiduidade: registros.filter((r) => r.recebeu).length,
      semAssiduidade: registros.filter((r) => !r.recebeu).length,
      totalFuncionarios: registros.length,
      plrsTrimestre,
    });
  } catch (err) {
    console.error('[GET bonificacoes resumo]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
