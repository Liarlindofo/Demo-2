export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

/**
 * GET /api/tarefas/revisao
 *
 * Lista TarefaAtribuida com emRevisaoAdm = true e revisadaPor = null,
 * incluindo todas as evidências para exibição na fila de revisão.
 */
export async function GET() {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const pendentes = await prisma.tarefaAtribuida.findMany({
    where: {
      userId: rh.userId,
      emRevisaoAdm: true,
      revisadaPor: null,
    },
    include: {
      template: { select: { titulo: true, descricao: true } },
      funcionario: { select: { id: true, nome: true } },
      loja: { select: { id: true, nome: true } },
      evidencias: {
        select: {
          id: true,
          tipo: true,
          conteudoTexto: true,
          urlArquivo: true,
          latitude: true,
          longitude: true,
          analiseIA: true,
          recebidaEm: true,
        },
        orderBy: { recebidaEm: 'asc' },
      },
    },
    orderBy: { dataAgendada: 'asc' },
  });

  return NextResponse.json(pendentes);
}
