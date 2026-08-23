export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';
import { defaultTipoPayload } from '@/lib/bonificacao-defaults';

async function seedTiposLoja(userId: string, lojaId: string, lojaNome: string) {
  const existentes = await prisma.tipoAvaliacao.count({ where: { userId, lojaId } });
  if (existentes > 0) return;

  const padrao = defaultTipoPayload('PADRAO');
  const isCentral = lojaNome.toLowerCase().includes('central');

  const tipos = isCentral
    ? [{ nome: 'Central/Escritório', modoCalculo: 'MEDIA' as const, payload: defaultTipoPayload('MEDIA') }]
    : [
        { nome: 'Gerente', modoCalculo: 'PADRAO' as const, payload: padrao },
      ];

  await prisma.tipoAvaliacao.createMany({
    data: tipos.map(t => ({
      userId,
      lojaId,
      lojaNome,
      nome: t.nome,
      modoCalculo: t.modoCalculo,
      metricas: t.payload.metricas as object,
      descontos: t.payload.descontos as object,
      faixas: t.payload.faixas as object,
    })),
  });
}

/**
 * GET /api/tipos-avaliacao?lojaId=xxx
 * Lista tipos da loja (cria padrão se vazio).
 */
export async function GET(req: NextRequest) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const lojaId = req.nextUrl.searchParams.get('lojaId');
  if (!lojaId) return NextResponse.json({ error: 'lojaId obrigatório' }, { status: 400 });

  const loja = await prisma.rhLoja.findFirst({ where: { id: lojaId, userId: ctx.userId } });
  if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

  await seedTiposLoja(ctx.userId, loja.id, loja.nome);

  const items = await prisma.tipoAvaliacao.findMany({
    where: { userId: ctx.userId, lojaId },
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const ctx = await getBonificacaoAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    nome?: string;
    lojaId?: string;
    lojaNome?: string;
    modoCalculo?: string;
    metricas?: unknown;
    descontos?: unknown;
    faixas?: unknown;
  };

  const nome = body.nome?.trim();
  if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
  if (!body.lojaId) return NextResponse.json({ error: 'lojaId obrigatório' }, { status: 400 });

  const loja = await prisma.rhLoja.findFirst({
    where: { id: body.lojaId, userId: ctx.userId },
  });
  if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

  const modoCalculo = body.modoCalculo === 'MEDIA' ? 'MEDIA' : 'PADRAO';
  const defaults = defaultTipoPayload(modoCalculo);

  try {
    const item = await prisma.tipoAvaliacao.create({
      data: {
        userId: ctx.userId,
        lojaId: loja.id,
        lojaNome: loja.nome,
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
      return NextResponse.json({ error: 'Já existe um tipo com este nome nesta loja' }, { status: 409 });
    }
    throw err;
  }
}
