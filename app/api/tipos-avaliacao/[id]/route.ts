export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';

type Params = { params: Promise<{ id: string }> };

/** GET /api/tipos-avaliacao/:id */
export async function GET(_req: NextRequest, { params }: Params) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const item = await prisma.tipoAvaliacao.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(item);
}

/** PATCH /api/tipos-avaliacao/:id */
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.tipoAvaliacao.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    nome?: string;
    modoCalculo?: string;
    metricas?: unknown;
    descontos?: unknown;
    faixas?: unknown;
  };

  const data: Record<string, unknown> = {};
  if (body.nome?.trim()) data.nome = body.nome.trim();
  if (body.modoCalculo === 'MEDIA' || body.modoCalculo === 'PADRAO') data.modoCalculo = body.modoCalculo;
  if (body.metricas !== undefined) data.metricas = body.metricas;
  if (body.descontos !== undefined) data.descontos = body.descontos;
  if (body.faixas !== undefined) data.faixas = body.faixas;

  try {
    const updated = await prisma.tipoAvaliacao.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um tipo com este nome' }, { status: 409 });
    }
    throw err;
  }
}

/** DELETE /api/tipos-avaliacao/:id — remove o tipo e os planos trimestrais vinculados */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.tipoAvaliacao.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const vinculados = await prisma.bonificacaoTrimestre.count({
    where: { tipoAvaliacaoId: id, userId: ctx.userId },
  });

  await prisma.$transaction([
    prisma.bonificacaoTrimestre.deleteMany({
      where: { tipoAvaliacaoId: id, userId: ctx.userId },
    }),
    prisma.tipoAvaliacao.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true, planosRemovidos: vinculados });
}
