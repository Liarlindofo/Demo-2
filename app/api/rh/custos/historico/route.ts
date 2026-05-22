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
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const snapshots = await prisma.rhSnapshotCustoMensal.findMany({
      where: { userId: dbUser.id },
      include: { loja: { select: { nome: true } } },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });

    return NextResponse.json(snapshots);
  } catch (err) {
    console.error('[GET /api/rh/custos/historico]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
