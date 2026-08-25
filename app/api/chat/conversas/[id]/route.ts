export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const conversa = await prisma.chatConversa.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        mensagens: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ conversa });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Chat conversa GET]', message);
    return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const conversa = await prisma.chatConversa.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    await prisma.chatConversa.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Chat conversa DELETE]', message);
    return NextResponse.json({ error: 'Erro ao deletar conversa' }, { status: 500 });
  }
}
