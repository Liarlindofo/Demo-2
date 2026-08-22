import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEstoqueTenantContext } from '@/lib/estoque-tenant';
import type { StockSession } from '../../../estoque/types';

export const dynamic = 'force-dynamic';

// ── GET: listar todas as contagens do tenant ─────────────────────────────────
export async function GET() {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userIds } = ctx;
    const contagens = await prisma.estoqueContagem.findMany({
      where: { userId: { in: userIds } },
      orderBy: { dataCriacao: 'desc' },
    });

    const sessions: StockSession[] = contagens.map(c => ({
      id: c.id,
      dataCriacao: c.dataCriacao.toISOString(),
      status: c.status as 'em_andamento' | 'concluida',
      sessoes: c.sessoes as unknown as StockSession['sessoes'],
      criadoPor: c.criadoPor,
      lojaNome: c.lojaNome,
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
    const ctx = await getEstoqueTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { tenantUserId } = ctx;

    const body = await request.json();
    const { sessoes, criadoPor = 'Gerente', lojaNome } = body;

    if (!Array.isArray(sessoes)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const contagem = await prisma.estoqueContagem.create({
      data: {
        userId: tenantUserId,
        criadoPor,
        lojaNome: lojaNome || null,
        sessoes,
        status: 'em_andamento',
      },
    });

    const session: StockSession = {
      id: contagem.id,
      dataCriacao: contagem.dataCriacao.toISOString(),
      status: 'em_andamento',
      sessoes: contagem.sessoes as unknown as StockSession['sessoes'],
      criadoPor: contagem.criadoPor,
      lojaNome: contagem.lojaNome,
    };

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('❌ Estoque POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar contagem' }, { status: 500 });
  }
}
