import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

async function verifyPosicaoOwner(posicaoId: string, userId: string) {
  return prisma.rhPosicaoIdeal.findFirst({
    where: { id: posicaoId, setor: { quadroIdeal: { userId } } },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const posicao = await verifyPosicaoOwner(id, dbUser.id);
    if (!posicao) return NextResponse.json({ error: 'Posição não encontrada' }, { status: 404 });

    const { cargoId, turno, quantidadeIdeal, observacoes } = await req.json();

    const updated = await prisma.rhPosicaoIdeal.update({
      where: { id },
      data: {
        ...(cargoId !== undefined && { cargoId }),
        ...(turno !== undefined && { turno }),
        ...(quantidadeIdeal !== undefined && { quantidadeIdeal: Number(quantidadeIdeal) }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
      },
      include: { cargo: { select: { id: true, nome: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/rh/quadro-ideal/posicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const posicao = await verifyPosicaoOwner(id, dbUser.id);
    if (!posicao) return NextResponse.json({ error: 'Posição não encontrada' }, { status: 404 });

    await prisma.rhPosicaoIdeal.update({ where: { id }, data: { ativo: false } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/quadro-ideal/posicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
