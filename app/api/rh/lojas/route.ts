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

    const lojas = await prisma.rhLoja.findMany({
      where: { userId: dbUser.id },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(lojas);
  } catch (err) {
    console.error('[GET /api/rh/lojas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { nome, cnpj, endereco } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const loja = await prisma.rhLoja.create({
      data: {
        userId: dbUser.id,
        nome: nome.trim(),
        cnpj: cnpj || null,
        endereco: endereco || null,
      },
    });

    return NextResponse.json(loja, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/lojas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
