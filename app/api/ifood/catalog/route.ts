export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/catalog?merchantId=
// Retorna itens do cardápio do banco local (sincronizados previamente).
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await getPrismaUser(stackUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId é obrigatório' }, { status: 400 });
    }

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const items = await db.ifoodCatalogItem.findMany({
      where: { userId: user.id, merchantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        itemId: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        status: true,
        category: true,
        categoryId: true,
        imageUrl: true,
        syncedAt: true,
      },
    });

    const lastSync = items[0]?.syncedAt ?? null;

    return NextResponse.json({ items, lastSync, total: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/catalog]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
