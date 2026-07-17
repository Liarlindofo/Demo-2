export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

/**
 * GET /api/tarefas/relatorios
 *
 * Query: inicio (YYYY-MM-DD), fim (YYYY-MM-DD), lojaId?, funcionarioId?
 *
 * Retorna:
 * - kpis: métricas do período
 * - por_loja: dados agrupados para o gráfico de barras
 * - itens: linhas detalhadas para a tabela
 */
export async function GET(req: NextRequest) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');
  const lojaId = searchParams.get('lojaId') || undefined;
  const funcionarioId = searchParams.get('funcionarioId') || undefined;

  if (!inicio || !fim) {
    return NextResponse.json({ error: 'Parâmetros inicio e fim são obrigatórios.' }, { status: 400 });
  }

  // Interpreta como meia-noite e fim do dia em America/Sao_Paulo (UTC-3 fixo)
  const dataInicio = new Date(`${inicio}T00:00:00-03:00`);
  const dataFim = new Date(`${fim}T23:59:59.999-03:00`);

  const atribuicoes = await prisma.tarefaAtribuida.findMany({
    where: {
      userId: rh.userId,
      dataAgendada: { gte: dataInicio, lte: dataFim },
      ...(lojaId ? { lojaId } : {}),
      ...(funcionarioId ? { funcionarioId } : {}),
    },
    include: {
      template: { select: { titulo: true } },
      funcionario: {
        select: { id: true, nome: true, cargo: { select: { nome: true } } },
      },
      loja: { select: { id: true, nome: true } },
      evidencias: {
        where: { tipo: 'FOTO' },
        select: { analiseIA: true },
        take: 1,
      },
    },
    orderBy: { dataAgendada: 'desc' },
  });

  // KPIs
  const total = atribuicoes.length;
  const concluidas = atribuicoes.filter((a) => a.status === 'CONCLUIDA').length;
  const atrasadas = atribuicoes.filter((a) => a.status === 'CONCLUIDA_COM_ATRASO').length;
  const naoConcluidas = atribuicoes.filter((a) => a.status === 'NAO_CONCLUIDA').length;
  const emRevisao = atribuicoes.filter((a) => a.emRevisaoAdm).length;

  // Dados agrupados por loja para o gráfico
  const lojaMap = new Map<
    string,
    { loja: string; total: number; prazo: number; atraso: number; naoConcluida: number }
  >();

  for (const a of atribuicoes) {
    const entry = lojaMap.get(a.lojaId) ?? {
      loja: a.loja.nome,
      total: 0,
      prazo: 0,
      atraso: 0,
      naoConcluida: 0,
    };
    entry.total++;
    if (a.status === 'CONCLUIDA') entry.prazo++;
    else if (a.status === 'CONCLUIDA_COM_ATRASO') entry.atraso++;
    else if (a.status === 'NAO_CONCLUIDA') entry.naoConcluida++;
    lojaMap.set(a.lojaId, entry);
  }

  // Linhas detalhadas para a tabela
  const itens = atribuicoes.map((a) => {
    const analiseIARaw = a.evidencias[0]?.analiseIA;
    const analiseIA =
      analiseIARaw && typeof analiseIARaw === 'object' ? (analiseIARaw as Record<string, unknown>) : null;

    return {
      id: a.id,
      dataAgendada: a.dataAgendada.toISOString(),
      concluidaEm: a.concluidaEm?.toISOString() ?? null,
      minutosAtraso: a.minutosAtraso,
      status: a.status,
      emRevisaoAdm: a.emRevisaoAdm,
      template: { titulo: a.template.titulo },
      funcionario: { nome: a.funcionario.nome, cargo: a.funcionario.cargo?.nome ?? null },
      loja: { nome: a.loja.nome },
      observacaoIA: (analiseIA?.observacao as string | undefined) ?? null,
    };
  });

  return NextResponse.json({
    kpis: {
      total,
      concluidas,
      atrasadas,
      naoConcluidas,
      emRevisao,
      pctPrazo: total > 0 ? Math.round((concluidas / total) * 100) : 0,
      pctAtraso: total > 0 ? Math.round((atrasadas / total) * 100) : 0,
      pctNaoConcluida: total > 0 ? Math.round((naoConcluidas / total) * 100) : 0,
    },
    por_loja: Array.from(lojaMap.values()),
    itens,
  });
}
