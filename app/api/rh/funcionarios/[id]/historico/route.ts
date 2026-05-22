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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const historico = await prisma.rhHistoricoFuncionario.findMany({
      where: { funcionarioId: id, userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(historico);
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]/historico]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
