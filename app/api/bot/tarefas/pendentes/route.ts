export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBotAuth } from '@/lib/bot-auth';

/**
 * GET /api/bot/tarefas/pendentes?ate=ISO_DATETIME
 *
 * Retorna tarefas AGENDADA cuja dataAgendada <= agora (ou <= ate se informado).
 * O bot consulta este endpoint periodicamente para disparar as mensagens
 * no horário exato configurado por cada tarefa.
 */
export async function GET(req: NextRequest) {
  const authError = requireBotAuth(req);
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const ateParam = searchParams.get('ate');

  const limite = ateParam ? new Date(ateParam) : new Date();
  if (isNaN(limite.getTime())) {
    return NextResponse.json({ error: 'Parâmetro ate inválido.' }, { status: 400 });
  }

  const pendentes = await prisma.tarefaAtribuida.findMany({
    where: {
      status: 'AGENDADA',
      dataAgendada: { lte: limite },
    },
    include: {
      template: {
        select: {
          titulo: true,
          descricao: true,
          exigeFoto: true,
          exigeConfirmacaoTexto: true,
          exigeLocalizacao: true,
          exigeArquivo: true,
          validacaoIA: true,
        },
      },
      funcionario: {
        select: { id: true, nome: true, telefone: true },
      },
      loja: { select: { id: true, nome: true } },
    },
    orderBy: { dataAgendada: 'asc' },
  });

  return NextResponse.json(pendentes);
}
