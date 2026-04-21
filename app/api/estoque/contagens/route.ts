import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import type { StockSession } from '@/app/estoque/types';

export const dynamic = 'force-dynamic';

// ── GET: listar todas as contagens do usuário ─────────────────────────────────
export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const contagens = await prisma.estoqueContagem.findMany({
      where: { userId: dbUser.id },
      orderBy: { dataCriacao: 'desc' },
    });

    const sessions: StockSession[] = contagens.map(c => ({
      id: c.id,
      dataCriacao: c.dataCriacao.toISOString(),
      status: c.status as 'em_andamento' | 'concluida',
      sessoes: c.sessoes as StockSession['sessoes'],
      criadoPor: c.criadoPor,
    }));

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('❌ Estoque GET error:', error);
    return NextResponse.json({ error: 'Erro ao carregar contagens' }, { status: 500 });
  }
}

// ── POST: criar nova contagem ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const body = await request.json();
    const { sessoes, criadoPor = 'Gerente' } = body;

    if (!Array.isArray(sessoes)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const contagem = await prisma.estoqueContagem.create({
      data: {
        userId: dbUser.id,
        criadoPor,
        sessoes,
        status: 'em_andamento',
      },
    });

    const session: StockSession = {
      id: contagem.id,
      dataCriacao: contagem.dataCriacao.toISOString(),
      status: 'em_andamento',
      sessoes: contagem.sessoes as StockSession['sessoes'],
      criadoPor: contagem.criadoPor,
    };

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('❌ Estoque POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar contagem' }, { status: 500 });
  }
}
