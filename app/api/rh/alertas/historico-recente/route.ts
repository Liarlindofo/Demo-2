import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const historico = await prisma.rhHistoricoFuncionario.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        funcionario: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(historico);
  } catch (err) {
    console.error('[GET /api/rh/alertas/historico-recente]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
