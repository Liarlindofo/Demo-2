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

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { quadroIdealId, nome, descricao, ordem } = await req.json();
    if (!quadroIdealId || !nome?.trim())
      return NextResponse.json({ error: 'quadroIdealId e nome são obrigatórios' }, { status: 400 });

    // Verificar que o quadro pertence ao usuário
    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { id: quadroIdealId, userId: dbUser.id },
    });
    if (!quadro) return NextResponse.json({ error: 'Quadro não encontrado' }, { status: 404 });

    const setor = await prisma.rhSetorIdeal.create({
      data: {
        quadroIdealId,
        nome: nome.trim(),
        descricao: descricao || null,
        ordem: ordem ?? 0,
      },
      include: {
        posicoes: { where: { ativo: true }, include: { cargo: { select: { id: true, nome: true } } } },
      },
    });

    return NextResponse.json(setor, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/quadro-ideal/setores]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
