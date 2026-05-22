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

const INCLUDE = {
  loja: { select: { id: true, nome: true } },
  setores: {
    where: { ativo: true },
    orderBy: { ordem: 'asc' as const },
    include: {
      posicoes: {
        where: { ativo: true },
        include: { cargo: { select: { id: true, nome: true } } },
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojaId = req.nextUrl.searchParams.get('lojaId');
    if (!lojaId) return NextResponse.json({ error: 'lojaId é obrigatório' }, { status: 400 });

    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { lojaId, userId: dbUser.id, ativo: true },
      include: INCLUDE,
    });

    return NextResponse.json(quadro ?? null);
  } catch (err) {
    console.error('[GET /api/rh/quadro-ideal]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { lojaId, nome } = await req.json();
    if (!lojaId) return NextResponse.json({ error: 'lojaId é obrigatório' }, { status: 400 });

    const loja = await prisma.rhLoja.findFirst({ where: { id: lojaId, userId: dbUser.id } });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const quadro = await prisma.rhQuadroIdeal.upsert({
      where: { lojaId },
      update: { nome: nome || null, ativo: true },
      create: { userId: dbUser.id, lojaId, nome: nome || null },
      include: INCLUDE,
    });

    return NextResponse.json(quadro, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/quadro-ideal]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
