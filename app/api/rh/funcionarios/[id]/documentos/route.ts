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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const func = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const documentos = await prisma.rhDocumentoFuncionario.findMany({
      where: { funcionarioId: id, userId: dbUser.id, ativo: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documentos);
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]/documentos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
