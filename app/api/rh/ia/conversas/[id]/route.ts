export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const conversa = await prisma.rhIaConversa.findFirst({
      where: { id, userId: rh.userId },
      include: {
        mensagens: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ conversa });
  } catch (error: any) {
    console.error('[RH IA conversa GET]', error.message);
    return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const conversa = await prisma.rhIaConversa.findFirst({
      where: { id, userId: rh.userId },
    });

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    await prisma.rhIaConversa.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[RH IA conversa DELETE]', error.message);
    return NextResponse.json({ error: 'Erro ao deletar conversa' }, { status: 500 });
  }
}
