import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEstoqueTenantContext } from '@/lib/estoque-tenant';
import type { StockSession } from '../../../../estoque/types';

export const dynamic = 'force-dynamic';

// ── PATCH: atualizar sessões e/ou status ──────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { userIds } = ctx;
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.estoqueContagem.findUnique({ where: { id } });
    if (!existing || !userIds.includes(existing.userId)) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    const updated = await prisma.estoqueContagem.update({
      where: { id },
      data: {
        ...(body.sessoes !== undefined && { sessoes: body.sessoes }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    const session: StockSession = {
      id: updated.id,
      dataCriacao: updated.dataCriacao.toISOString(),
      status: updated.status as 'em_andamento' | 'concluida',
      sessoes: updated.sessoes as unknown as StockSession['sessoes'],
      criadoPor: updated.criadoPor,
      lojaNome: updated.lojaNome,
    };

    return NextResponse.json(session);
  } catch (error) {
    console.error('❌ Estoque PATCH error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar contagem' }, { status: 500 });
  }
}

// ── DELETE: excluir contagem ──────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { userIds } = ctx;
    const { id } = await params;

    const existing = await prisma.estoqueContagem.findUnique({ where: { id } });
    if (!existing || !userIds.includes(existing.userId)) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    await prisma.estoqueContagem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Estoque DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao excluir contagem' }, { status: 500 });
  }
}
