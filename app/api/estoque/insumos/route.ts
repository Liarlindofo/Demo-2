import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  dedupeInsumosBySlug,
  getEstoqueTenantContext,
} from '@/lib/estoque-tenant';
import { INSUMOS_PADRAO } from '@/lib/estoque-insumos-padrao';

export const dynamic = 'force-dynamic';

// ── GET: lista insumos do tenant; faz seed automático se ainda não tem nenhum ──
export async function GET() {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { tenantUserId, userIds } = ctx;

    let insumos = await prisma.estoqueInsumo.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ categoriaId: 'asc' }, { createdAt: 'asc' }],
    });

    insumos = dedupeInsumosBySlug(insumos, tenantUserId);

    // Seed automático na primeira vez que o tenant acessa (nenhum membro tem dados)
    if (insumos.length === 0) {
      await prisma.estoqueInsumo.createMany({
        data: INSUMOS_PADRAO.map(p => ({
          userId: tenantUserId,
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
        where: { userId: tenantUserId },
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
    const ctx = await getEstoqueTenantContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { tenantUserId } = ctx;

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
        userId: tenantUserId,
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
