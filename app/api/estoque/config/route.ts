export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getEstoqueTenantContext,
  mergeProdutoConfigs,
  mergeProdutoOrdem,
} from '@/lib/estoque-tenant';

// GET /api/estoque/config
// Retorna { configs: EstoqueConfigMap, order: string[] }
export async function GET() {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { tenantUserId, userIds } = ctx;

    const [configs, ordemRows] = await Promise.all([
      prisma.estoqueProdutoConfig.findMany({
        where: { userId: { in: userIds } },
      }),
      prisma.estoqueProdutoOrdem.findMany({
        where: { userId: { in: userIds } },
      }),
    ]);

    const configMap = mergeProdutoConfigs(configs, tenantUserId);
    const order = mergeProdutoOrdem(ordemRows, tenantUserId);

    return NextResponse.json({ configs: configMap, order });
  } catch (error) {
    console.error('[estoque/config GET]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH /api/estoque/config
// Body: { type: 'produto', produtoId, ativo?, estoqueMinimo?, modoContagem?, kgPorUnidade? }
//    ou { type: 'ordem', order: string[] }
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getEstoqueTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { tenantUserId } = ctx;
    const body = await request.json();

    if (body.type === 'ordem') {
      const order: string[] = Array.isArray(body.order) ? body.order : [];

      await prisma.estoqueProdutoOrdem.upsert({
        where: { userId: tenantUserId },
        update: { ordem: order },
        create: { userId: tenantUserId, ordem: order },
      });

      return NextResponse.json({ ok: true });
    }

    if (body.type === 'produto') {
      const { produtoId, ativo, estoqueMinimo, modoContagem, kgPorUnidade } = body;

      if (!produtoId) {
        return NextResponse.json({ error: 'produtoId obrigatório' }, { status: 400 });
      }

      await prisma.estoqueProdutoConfig.upsert({
        where: { userId_produtoId: { userId: tenantUserId, produtoId } },
        update: {
          ...(ativo !== undefined ? { ativo: Boolean(ativo) } : {}),
          ...(estoqueMinimo !== undefined ? { estoqueMinimo: estoqueMinimo === null ? null : Number(estoqueMinimo) } : {}),
          ...(modoContagem !== undefined ? { modoContagem: String(modoContagem) } : {}),
          ...(kgPorUnidade !== undefined ? { kgPorUnidade: kgPorUnidade === null ? null : Number(kgPorUnidade) } : {}),
        },
        create: {
          userId: tenantUserId,
          produtoId,
          ativo: ativo !== undefined ? Boolean(ativo) : true,
          estoqueMinimo: estoqueMinimo !== undefined && estoqueMinimo !== null ? Number(estoqueMinimo) : null,
          modoContagem: modoContagem ? String(modoContagem) : 'kg',
          kgPorUnidade: kgPorUnidade !== undefined && kgPorUnidade !== null ? Number(kgPorUnidade) : null,
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'type inválido' }, { status: 400 });
  } catch (error) {
    console.error('[estoque/config PATCH]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
