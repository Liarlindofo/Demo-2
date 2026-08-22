import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEstoqueTenantContext } from '@/lib/estoque-tenant';

export const dynamic = 'force-dynamic';

// ── PATCH: atualiza nome / unidade de um insumo ──────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { userIds } = ctx;

    const { id } = await params;
    const body = await req.json();
    const { nome, unidade } = body;

    const existing = await prisma.estoqueInsumo.findFirst({
      where: { id, userId: { in: userIds } },
    });
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    const updated = await prisma.estoqueInsumo.update({
      where: { id },
      data: {
        ...(nome ? { nome: nome.trim().toUpperCase() } : {}),
        ...(unidade ? { unidade: unidade.trim() } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/estoque/insumos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ── DELETE: remove um insumo ──────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { userIds } = ctx;

    const { id } = await params;

    const existing = await prisma.estoqueInsumo.findFirst({
      where: { id, userId: { in: userIds } },
    });
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    await prisma.estoqueInsumo.delete({ where: { id } });

    // Limpa também a config associada a esse insumo (todos os userIds do tenant)
    await prisma.estoqueProdutoConfig.deleteMany({
      where: { userId: { in: userIds }, produtoId: existing.insumoId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/estoque/insumos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
