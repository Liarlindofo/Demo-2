export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

/**
 * PATCH /api/tarefas/revisao/:id
 *
 * Body: { acao: 'aprovar' | 'nao_conforme' }
 *
 * - 'aprovar': limpa emRevisaoAdm, mantém status atual.
 * - 'nao_conforme': limpa emRevisaoAdm, define status = NAO_CONCLUIDA.
 * Ambas as ações gravam revisadaPor (userId do admin) e revisadaEm.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;

  const atribuicao = await prisma.tarefaAtribuida.findFirst({
    where: { id, userId: rh.userId, emRevisaoAdm: true },
    select: { id: true, status: true },
  });

  if (!atribuicao) {
    return NextResponse.json(
      { error: 'Tarefa não encontrada ou já revisada.' },
      { status: 404 },
    );
  }

  const body = await req.json();
  const { acao } = body;

  if (!['aprovar', 'nao_conforme'].includes(acao)) {
    return NextResponse.json(
      { error: 'Ação inválida. Use: aprovar ou nao_conforme.' },
      { status: 400 },
    );
  }

  const agora = new Date();

  const atualizada = await prisma.tarefaAtribuida.update({
    where: { id },
    data: {
      emRevisaoAdm: false,
      revisadaPor: rh.userId,
      revisadaEm: agora,
      ...(acao === 'nao_conforme' ? { status: 'NAO_CONCLUIDA' } : {}),
    },
  });

  return NextResponse.json(atualizada);
}
