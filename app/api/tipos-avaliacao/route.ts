export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';
import { defaultTipoPayload } from '@/lib/bonificacao-defaults';

/**
 * GET /api/tipos-avaliacao — lista tipos do usuário
 * POST /api/tipos-avaliacao — cria novo tipo
 */
export async function GET() {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let items = await prisma.tipoAvaliacao.findMany({
    where: { userId: ctx.userId },
    orderBy: { nome: 'asc' },
  });

  if (items.length === 0) {
    const padrao = defaultTipoPayload('PADRAO');
    const media = defaultTipoPayload('MEDIA');
    await prisma.tipoAvaliacao.createMany({
      data: [
        {
          userId: ctx.userId,
          nome: 'Gerente',
          modoCalculo: 'PADRAO',
          metricas: padrao.metricas as object,
          descontos: padrao.descontos as object,
          faixas: padrao.faixas as object,
        },
        {
          userId: ctx.userId,
          nome: 'Central/Escritório',
          modoCalculo: 'MEDIA',
          metricas: media.metricas as object,
          descontos: media.descontos as object,
          faixas: media.faixas as object,
        },
      ],
    });
    items = await prisma.tipoAvaliacao.findMany({
      where: { userId: ctx.userId },
      orderBy: { nome: 'asc' },
    });
  }

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    nome?: string;
    modoCalculo?: string;
    metricas?: unknown;
    descontos?: unknown;
    faixas?: unknown;
  };

  const nome = body.nome?.trim();
  if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });

  const modoCalculo = body.modoCalculo === 'MEDIA' ? 'MEDIA' : 'PADRAO';
  const defaults = defaultTipoPayload(modoCalculo);

  try {
    const item = await prisma.tipoAvaliacao.create({
      data: {
        userId: ctx.userId,
        nome,
        modoCalculo,
        metricas: (body.metricas ?? defaults.metricas) as object,
        descontos: (body.descontos ?? defaults.descontos) as object,
        faixas: (body.faixas ?? defaults.faixas) as object,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Já existe um tipo com este nome' }, { status: 409 });
    }
    throw err;
  }
}
