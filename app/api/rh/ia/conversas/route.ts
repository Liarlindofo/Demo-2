export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const conversas = await prisma.rhIaConversa.findMany({
      where: { userId: rh.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        mensagens: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({ conversas });
  } catch (error: any) {
    console.error('[RH IA conversas GET]', error.message);
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const titulo = body.titulo ?? null;

    const conversa = await prisma.rhIaConversa.create({
      data: { userId: rh.userId, titulo },
    });

    return NextResponse.json({ conversa }, { status: 201 });
  } catch (error: any) {
    console.error('[RH IA conversas POST]', error.message);
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
  }
}
