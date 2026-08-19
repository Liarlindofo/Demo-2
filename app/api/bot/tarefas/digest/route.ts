export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBotAuth } from '@/lib/bot-auth';
import { funcionarioEstaDeFolga } from '@/lib/rh-folga';

/**
 * GET /api/bot/tarefas/digest?data=YYYY-MM-DD
 *
 * Retorna todas as TarefaAtribuida com status AGENDADA do dia informado,
 * agrupadas por funcionário com telefone e horarioDigest. Usado pelo bot
 * para montar o resumo diário de tarefas no horário configurado por funcionário.
 */
export async function GET(req: NextRequest) {
  const authError = requireBotAuth(req);
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const data = searchParams.get('data');

  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json(
      { error: 'Parâmetro data é obrigatório no formato YYYY-MM-DD.' },
      { status: 400 },
    );
  }

  // Interpreta como meia-noite e fim do dia em America/Sao_Paulo (UTC-3 fixo)
  const inicio = new Date(`${data}T00:00:00-03:00`);
  const fim = new Date(`${data}T23:59:59.999-03:00`);

  const atribuicoes = await prisma.tarefaAtribuida.findMany({
    where: {
      status: 'AGENDADA',
      dataAgendada: { gte: inicio, lte: fim },
      template: { ativo: true },
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
        select: { id: true, nome: true, telefone: true, horarioDigest: true, diasFolga: true, domingoFolga: true, ativo: true, statusFerias: true },
      },
      loja: { select: { id: true, nome: true } },
    },
    orderBy: [{ funcionarioId: 'asc' }, { dataAgendada: 'asc' }],
  });

  // Agrupar por funcionário
  const map = new Map<
    string,
    {
      userId: string;
      funcionario: {
        id: string;
        nome: string;
        telefone: string | null;
        horarioDigest: string;
      };
      loja: { id: string; nome: string };
      tarefas: object[];
    }
  >();

  for (const a of atribuicoes) {
    if (funcionarioEstaDeFolga(a.funcionario, a.dataAgendada)) continue;

    if (!map.has(a.funcionarioId)) {
      map.set(a.funcionarioId, {
        userId: a.userId,
        funcionario: a.funcionario,
        loja: a.loja,
        tarefas: [],
      });
    }
    map.get(a.funcionarioId)!.tarefas.push({
      id: a.id,
      titulo: a.template.titulo,
      descricao: a.template.descricao,
      horario: a.dataAgendada.toISOString(),
      evidencias: {
        exigeFoto: a.template.exigeFoto,
        exigeConfirmacaoTexto: a.template.exigeConfirmacaoTexto,
        exigeLocalizacao: a.template.exigeLocalizacao,
        exigeArquivo: a.template.exigeArquivo,
      },
      validacaoIA: a.template.validacaoIA,
    });
  }

  return NextResponse.json(Array.from(map.values()));
}
