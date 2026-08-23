export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';
import { snapshotFromTipo, type DadosBonificacaoSnapshot } from '@/lib/bonificacao-defaults';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/tipos-avaliacao/:id/sincronizar-planos
 * Atualiza todos os planos trimestrais vinculados a este tipo.
 * Métricas/descontos removidos do tipo saem do plano; pontos das que permanecem são mantidos.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const tipo = await prisma.tipoAvaliacao.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!tipo) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const planos = await prisma.bonificacaoTrimestre.findMany({
    where: { tipoAvaliacaoId: id, userId: ctx.userId },
  });

  let atualizados = 0;
  for (const plano of planos) {
    const dados = snapshotFromTipo(
      tipo,
      plano.dados as unknown as DadosBonificacaoSnapshot,
    );
    await prisma.bonificacaoTrimestre.update({
      where: { id: plano.id },
      data: { dados: dados as object },
    });
    atualizados++;
  }

  return NextResponse.json({ atualizados });
}
