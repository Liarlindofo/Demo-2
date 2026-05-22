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
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

async function verifySetorOwner(setorId: string, userId: string) {
  return prisma.rhSetorIdeal.findFirst({
    where: { id: setorId, quadroIdeal: { userId } },
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

    const setor = await verifySetorOwner(id, dbUser.id);
    if (!setor) return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 });

    const { nome, descricao, ordem } = await req.json();

    const updated = await prisma.rhSetorIdeal.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(descricao !== undefined && { descricao: descricao || null }),
        ...(ordem !== undefined && { ordem }),
      },
      include: {
        posicoes: {
          where: { ativo: true },
          include: { cargo: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/rh/quadro-ideal/setores/[id]]', err);
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

    const setor = await verifySetorOwner(id, dbUser.id);
    if (!setor) return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 });

    // Soft delete: marca setor e todas as posições como inativos
    await prisma.$transaction([
      prisma.rhPosicaoIdeal.updateMany({ where: { setorId: id }, data: { ativo: false } }),
      prisma.rhSetorIdeal.update({ where: { id }, data: { ativo: false } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/quadro-ideal/setores/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
