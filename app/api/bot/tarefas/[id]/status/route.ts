export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBotAuth } from '@/lib/bot-auth';

/**
 * Transições de status válidas para o bot.
 * AGENDADA → ENVIADA: bot despachou a mensagem ao funcionário.
 * ENVIADA → AGUARDANDO_EVIDENCIA: funcionário respondeu e está enviando evidências.
 * AGUARDANDO_EVIDENCIA → CONCLUIDA | CONCLUIDA_COM_ATRASO | NAO_CONCLUIDA: encerramento.
 * Qualquer estado pode ir para NAO_CONCLUIDA (tempo expirado, sem resposta).
 */
const TRANSICOES_VALIDAS: Record<string, string[]> = {
  AGENDADA: ['ENVIADA', 'NAO_CONCLUIDA'],
  ENVIADA: ['AGUARDANDO_EVIDENCIA', 'NAO_CONCLUIDA'],
  AGUARDANDO_EVIDENCIA: ['CONCLUIDA', 'CONCLUIDA_COM_ATRASO', 'NAO_CONCLUIDA'],
};

/**
 * PATCH /api/bot/tarefas/:id/status
 *
 * Body: {
 *   status: string,
 *   enviadaEm?: string (ISO),
 *   concluidaEm?: string (ISO),
 *   minutosAtraso?: number,
 *   emRevisaoAdm?: boolean
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireBotAuth(req);
  if (authError) return authError;

  const { id } = await params;

  const atribuicao = await prisma.tarefaAtribuida.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!atribuicao) {
    return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
  }

  const body = await req.json();
  const { status, enviadaEm, concluidaEm, minutosAtraso, emRevisaoAdm } = body;

  if (!status) {
    return NextResponse.json({ error: 'Campo status é obrigatório.' }, { status: 400 });
  }

  const permitidos = TRANSICOES_VALIDAS[atribuicao.status];
  if (!permitidos || !permitidos.includes(status)) {
    return NextResponse.json(
      {
        error: `Transição inválida: ${atribuicao.status} → ${status}. Transições permitidas: ${permitidos?.join(', ') ?? 'nenhuma'}.`,
      },
      { status: 409 },
    );
  }

  const atualizado = await prisma.tarefaAtribuida.update({
    where: { id },
    data: {
      status,
      ...(enviadaEm !== undefined && { enviadaEm: new Date(enviadaEm) }),
      ...(concluidaEm !== undefined && { concluidaEm: new Date(concluidaEm) }),
      ...(minutosAtraso !== undefined && { minutosAtraso: Number(minutosAtraso) }),
      ...(emRevisaoAdm !== undefined && { emRevisaoAdm: Boolean(emRevisaoAdm) }),
    },
  });

  return NextResponse.json(atualizado);
}
