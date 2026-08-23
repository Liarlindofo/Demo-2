export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';

/** GET /api/bonificacao/:id */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const item = await prisma.bonificacaoTrimestre.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(item);
}

/**
 * PATCH /api/bonificacao/:id
 * Body: { dados } — substitui todo o JSON de dados.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { dados?: unknown };

  if (!body.dados) return NextResponse.json({ error: 'dados obrigatório' }, { status: 400 });

  const existing = await prisma.bonificacaoTrimestre.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const updated = await prisma.bonificacaoTrimestre.update({
    where: { id },
    data: { dados: body.dados as object },
  });

  return NextResponse.json(updated);
}

/** DELETE /api/bonificacao/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.bonificacaoTrimestre.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  await prisma.bonificacaoTrimestre.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
