import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import type { StockSession } from '@/app/estoque/types';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

// ── PATCH: atualizar sessões e/ou status ──────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.estoqueContagem.findUnique({ where: { id } });
    if (!existing || existing.userId !== dbUser.id) {
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
      sessoes: updated.sessoes as StockSession['sessoes'],
      criadoPor: updated.criadoPor,
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
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.estoqueContagem.findUnique({ where: { id } });
    if (!existing || existing.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    await prisma.estoqueContagem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Estoque DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao excluir contagem' }, { status: 500 });
  }
}
