export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveDbUser } from '@/lib/effective-user';

// GET /api/estoque/config
// Retorna { configs: EstoqueConfigMap, order: string[] }
export async function GET() {
  try {
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const [configs, ordemRow] = await Promise.all([
      prisma.estoqueProdutoConfig.findMany({
        where: { userId: dbUser.id },
      }),
      prisma.estoqueProdutoOrdem.findUnique({
        where: { userId: dbUser.id },
      }),
    ]);

    // Mapear para o formato EstoqueConfigMap
    const configMap: Record<string, {
      ativo: boolean;
      estoqueMinimo?: number;
      modoContagem?: 'kg' | 'unidade';
      kgPorUnidade?: number;
    }> = {};

    for (const c of configs) {
      configMap[c.produtoId] = {
        ativo: c.ativo,
        estoqueMinimo: c.estoqueMinimo ?? undefined,
        modoContagem: (c.modoContagem as 'kg' | 'unidade') ?? 'kg',
        kgPorUnidade: c.kgPorUnidade ?? undefined,
      };
    }

    const order = Array.isArray(ordemRow?.ordem) ? (ordemRow.ordem as string[]) : [];

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
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    if (body.type === 'ordem') {
      const order: string[] = Array.isArray(body.order) ? body.order : [];

      await prisma.estoqueProdutoOrdem.upsert({
        where: { userId: dbUser.id },
        update: { ordem: order },
        create: { userId: dbUser.id, ordem: order },
      });

      return NextResponse.json({ ok: true });
    }

    if (body.type === 'produto') {
      const { produtoId, ativo, estoqueMinimo, modoContagem, kgPorUnidade } = body;

      if (!produtoId) {
        return NextResponse.json({ error: 'produtoId obrigatório' }, { status: 400 });
      }

      await prisma.estoqueProdutoConfig.upsert({
        where: { userId_produtoId: { userId: dbUser.id, produtoId } },
        update: {
          ...(ativo !== undefined ? { ativo: Boolean(ativo) } : {}),
          ...(estoqueMinimo !== undefined ? { estoqueMinimo: estoqueMinimo === null ? null : Number(estoqueMinimo) } : {}),
          ...(modoContagem !== undefined ? { modoContagem: String(modoContagem) } : {}),
          ...(kgPorUnidade !== undefined ? { kgPorUnidade: kgPorUnidade === null ? null : Number(kgPorUnidade) } : {}),
        },
        create: {
          userId: dbUser.id,
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
