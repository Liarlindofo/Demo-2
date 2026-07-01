import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveDbUser } from '@/lib/effective-user';

export const dynamic = 'force-dynamic';

// ── PATCH: atualiza nome / unidade de um insumo ──────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { nome, unidade } = body;

    const existing = await prisma.estoqueInsumo.findFirst({
      where: { id, userId: dbUser.id },
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
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.estoqueInsumo.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    await prisma.estoqueInsumo.delete({ where: { id } });

    // Limpa também a config associada a esse insumo
    await prisma.estoqueProdutoConfig.deleteMany({
      where: { userId: dbUser.id, produtoId: existing.insumoId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/estoque/insumos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
