export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const conversas = await prisma.rhIaConversa.findMany({
      where: { userId: user.id },
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
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const titulo = body.titulo ?? null;

    const conversa = await prisma.rhIaConversa.create({
      data: { userId: user.id, titulo },
    });

    return NextResponse.json({ conversa }, { status: 201 });
  } catch (error: any) {
    console.error('[RH IA conversas POST]', error.message);
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 });
  }
}
