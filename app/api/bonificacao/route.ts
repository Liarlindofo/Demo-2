export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';
import { snapshotFromTipo } from '@/lib/bonificacao-defaults';

/**
 * GET /api/bonificacao?ano=2026&trimestre=3&lojaId=xxx&tipoAvaliacaoId=yyy
 */
export async function GET(req: NextRequest) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const ano = searchParams.get('ano') ? Number(searchParams.get('ano')) : undefined;
  const trimestre = searchParams.get('trimestre') ? Number(searchParams.get('trimestre')) : undefined;
  const lojaId = searchParams.get('lojaId') ?? undefined;
  const tipoAvaliacaoId = searchParams.get('tipoAvaliacaoId') ?? undefined;

  const items = await prisma.bonificacaoTrimestre.findMany({
    where: {
      userId: ctx.userId,
      ...(ano ? { ano } : {}),
      ...(trimestre ? { trimestre } : {}),
      ...(lojaId ? { lojaId } : {}),
      ...(tipoAvaliacaoId ? { tipoAvaliacaoId } : {}),
    },
    include: {
      tipoAvaliacao: { select: { nome: true, modoCalculo: true, lojaId: true } },
    },
    orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }, { lojaNome: 'asc' }],
  });

  return NextResponse.json(items);
}

/**
 * POST /api/bonificacao
 * Cria plano para (loja, período, tipo). Cada combinação é independente.
 * Body: { lojaId, lojaNome, ano, trimestre, tipoAvaliacaoId }
 */
export async function POST(req: NextRequest) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    lojaId?: string;
    lojaNome?: string;
    ano?: number;
    trimestre?: number;
    tipoAvaliacaoId?: string;
  };

  const { lojaId, lojaNome, ano, trimestre, tipoAvaliacaoId } = body;
  if (!lojaNome?.trim()) return NextResponse.json({ error: 'lojaNome obrigatório' }, { status: 400 });
  if (!ano || !trimestre) return NextResponse.json({ error: 'ano e trimestre obrigatórios' }, { status: 400 });
  if (trimestre < 1 || trimestre > 4) return NextResponse.json({ error: 'trimestre inválido (1-4)' }, { status: 400 });
  if (!tipoAvaliacaoId) return NextResponse.json({ error: 'tipoAvaliacaoId obrigatório' }, { status: 400 });

  const tipo = await prisma.tipoAvaliacao.findFirst({
    where: { id: tipoAvaliacaoId, userId: ctx.userId },
  });
  if (!tipo) return NextResponse.json({ error: 'Tipo de avaliação não encontrado' }, { status: 404 });

  const existing = await prisma.bonificacaoTrimestre.findUnique({
    where: {
      userId_lojaNome_ano_trimestre_tipoAvaliacaoId: {
        userId: ctx.userId,
        lojaNome: lojaNome.trim(),
        ano,
        trimestre,
        tipoAvaliacaoId,
      },
    },
  });
  if (existing) return NextResponse.json(existing);

  const item = await prisma.bonificacaoTrimestre.create({
    data: {
      userId: ctx.userId,
      lojaId: lojaId ?? null,
      lojaNome: lojaNome.trim(),
      tipoAvaliacaoId,
      ano,
      trimestre,
      dados: snapshotFromTipo(tipo) as object,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
