export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

export async function GET() {
  try {
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const conversas = await prisma.chatConversa.findMany({
      where: { userId: dbUser.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        mensagens: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ conversas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Chat conversas GET]', message);
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const titulo = (body as { titulo?: string }).titulo ?? null;

    const conversa = await prisma.chatConversa.create({
      data: { userId: dbUser.id, titulo },
    });

    return NextResponse.json({ conversa }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Chat conversas POST]', message);
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
  }
}
