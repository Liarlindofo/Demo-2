import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { INSUMOS_PADRAO } from '@/lib/estoque-insumos-padrao';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
  });
}

// ── GET: lista insumos do usuário; faz seed automático se ainda não tem nenhum ──
export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let insumos = await prisma.estoqueInsumo.findMany({
      where: { userId: dbUser.id },
      orderBy: [{ categoriaId: 'asc' }, { createdAt: 'asc' }],
    });

    // Seed automático na primeira vez que o usuário acessa
    if (insumos.length === 0) {
      await prisma.estoqueInsumo.createMany({
        data: INSUMOS_PADRAO.map(p => ({
          userId: dbUser.id,
          insumoId: p.insumoId,
          nome: p.nome,
          unidade: p.unidade,
          categoriaId: p.categoriaId,
          categoriaNome: p.categoriaNome,
          categoriaIcone: p.categoriaIcone,
        })),
        skipDuplicates: true,
      });

      insumos = await prisma.estoqueInsumo.findMany({
        where: { userId: dbUser.id },
        orderBy: [{ categoriaId: 'asc' }, { createdAt: 'asc' }],
      });
    }

    return NextResponse.json(insumos);
  } catch (err) {
    console.error('[GET /api/estoque/insumos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ── POST: cria novo insumo ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { nome, unidade, categoriaId, categoriaNome, categoriaIcone } = body;

    if (!nome?.trim() || !unidade?.trim() || !categoriaId?.trim()) {
      return NextResponse.json({ error: 'nome, unidade e categoriaId são obrigatórios' }, { status: 400 });
    }

    // Gera um slug a partir do nome
    const insumoId = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now();

    const insumo = await prisma.estoqueInsumo.create({
      data: {
        userId: dbUser.id,
        insumoId,
        nome: nome.trim().toUpperCase(),
        unidade: unidade.trim(),
        categoriaId,
        categoriaNome: categoriaNome || categoriaId,
        categoriaIcone: categoriaIcone || '📦',
      },
    });

    return NextResponse.json(insumo, { status: 201 });
  } catch (err) {
    console.error('[POST /api/estoque/insumos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
