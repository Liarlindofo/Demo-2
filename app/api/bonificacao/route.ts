export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhContext } from '@/lib/rh-auth';
import { SystemTool } from '@/types/admin';
import { checkToolPermission } from '@/lib/auth/toolPermissions';
import { stackServerApp } from '@/stack';

async function getAuth() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  const ok = await checkToolPermission(stackUser.id, SystemTool.BONIFICACAO);
  if (!ok) return null;
  const ctx = await getRhContext();
  return ctx;
}

/**
 * GET /api/bonificacao?ano=2026&trimestre=3
 * Lista todos os trimestres do tenant para o ano/trimestre (ou todos se sem filtro).
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const ano = searchParams.get('ano') ? Number(searchParams.get('ano')) : undefined;
  const trimestre = searchParams.get('trimestre') ? Number(searchParams.get('trimestre')) : undefined;

  const items = await prisma.bonificacaoTrimestre.findMany({
    where: {
      userId: ctx.userId,
      ...(ano ? { ano } : {}),
      ...(trimestre ? { trimestre } : {}),
    },
    orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }, { lojaNome: 'asc' }],
  });

  return NextResponse.json(items);
}

/**
 * POST /api/bonificacao
 * Cria (ou retorna existente via upsert) um trimestre por loja.
 * Body: { lojaId?, lojaNome, ano, trimestre }
 */
export async function POST(req: NextRequest) {
  const ctx = await getAuth();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    lojaId?: string;
    lojaNome?: string;
    ano?: number;
    trimestre?: number;
  };

  const { lojaId, lojaNome, ano, trimestre } = body;
  if (!lojaNome?.trim()) return NextResponse.json({ error: 'lojaNome obrigatório' }, { status: 400 });
  if (!ano || !trimestre) return NextResponse.json({ error: 'ano e trimestre obrigatórios' }, { status: 400 });
  if (trimestre < 1 || trimestre > 4) return NextResponse.json({ error: 'trimestre inválido (1-4)' }, { status: 400 });

  const item = await prisma.bonificacaoTrimestre.upsert({
    where: {
      userId_lojaNome_ano_trimestre: {
        userId: ctx.userId,
        lojaNome: lojaNome.trim(),
        ano,
        trimestre,
      },
    },
    create: {
      userId: ctx.userId,
      lojaId: lojaId ?? null,
      lojaNome: lojaNome.trim(),
      ano,
      trimestre,
      dados: defaultDados(),
    },
    update: {},
  });

  return NextResponse.json(item, { status: 201 });
}

function defaultDados() {
  return {
    metricas: [
      { id: 'meta',            nome: 'Meta',                      maxPontos: 40, pontos: {} },
      { id: 'cmv',             nome: 'CMV (30%, 5%)',              maxPontos: 40, pontos: {} },
      { id: 'ifood',           nome: 'iFood (+4.8)',               maxPontos: 30, pontos: {} },
      { id: 'cancelamentos',   nome: 'Cancelamentos (<0,5%)',      maxPontos: 30, pontos: {} },
      { id: 'chargeback',      nome: 'Chargeback (<0,1%)',         maxPontos: 30, pontos: {} },
      { id: 'motoristas',      nome: 'Motoristas (1p a 1%)',       maxPontos: 30, pontos: {} },
      { id: 'mao_de_obra',     nome: 'Mão de Obra (<5%)',          maxPontos: 30, pontos: {} },
      { id: 'google_nota',     nome: 'Google Nota 1 (Max 4)',      maxPontos: 30, pontos: {} },
      { id: 'turnover',        nome: 'Turnover',                   maxPontos: 30, pontos: {} },
    ],
    descontos: [
      { id: 'lancamento_bnus', nome: 'Lançamentos de boys',        valor: 0 },
      { id: 'escala',          nome: 'Escala',                     valor: 0 },
      { id: 'transferencias',  nome: 'Transferências',             valor: 0 },
      { id: 'contagem',        nome: 'Contagem',                   valor: 0 },
      { id: 'caixa_atrasado',  nome: 'Caixa atrasado',            valor: 0 },
    ],
  };
}
