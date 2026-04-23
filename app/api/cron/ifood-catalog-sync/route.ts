import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  return !secret || auth === `Bearer ${secret}`;
}

interface IfoodSellableItem {
  id: string;
  name?: string;
  description?: string;
  price?: { originalValue?: number; value?: number };
  status?: string;
  category?: { id?: string; name?: string };
  logoUrl?: string;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// GET /api/cron/ifood-catalog-sync
// Executa diariamente às 03:00 UTC via Vercel Cron.
// Sincroniza cardápio de todas as lojas iFood ativas.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const startedAt = Date.now();
  let totalSynced = 0;
  let merchantsProcessed = 0;
  const errors: string[] = [];

  try {
    let token: string;
    try {
      token = await getValidIfoodToken();
    } catch {
      return NextResponse.json({ error: 'Token iFood inválido ou expirado' }, { status: 401 });
    }

    const connections = await db.ifoodConnection.findMany({
      where: { status: 'active' },
      select: { merchantId: true, userId: true },
    });

    if (connections.length === 0) {
      return NextResponse.json({ message: 'Nenhuma loja ativa', synced: 0 });
    }

    for (const conn of connections) {
      try {
        const catalogsRes = await fetch(
          `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${conn.merchantId}/catalogs`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) },
        );

        if (!catalogsRes.ok) {
          errors.push(`${conn.merchantId}: catalogs HTTP ${catalogsRes.status}`);
          continue;
        }

        const catalogsData = await catalogsRes.json() as
          | Array<{ catalogId: string }>
          | { catalogs?: Array<{ catalogId: string }> };

        const catalogs = Array.isArray(catalogsData)
          ? catalogsData
          : (catalogsData.catalogs ?? []);

        const syncedAt = new Date();

        for (const catalog of catalogs) {
          const itemsRes = await fetch(
            `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${conn.merchantId}/catalogs/${catalog.catalogId}/sellableItems`,
            { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) },
          );

          if (!itemsRes.ok) continue;

          const itemsData = await itemsRes.json() as
            | IfoodSellableItem[]
            | { sellableItems?: IfoodSellableItem[] };

          const items: IfoodSellableItem[] = Array.isArray(itemsData)
            ? itemsData
            : (itemsData.sellableItems ?? []);

          for (const item of items) {
            if (!item.id) continue;
            await db.ifoodCatalogItem.upsert({
              where: { itemId_merchantId: { itemId: item.id, merchantId: conn.merchantId } },
              create: {
                itemId: item.id,
                merchantId: conn.merchantId,
                userId: conn.userId,
                name: item.name ?? 'Sem nome',
                description: item.description ?? null,
                price: item.price?.value ?? item.price?.originalValue ?? 0,
                originalPrice: item.price?.originalValue ?? null,
                status: item.status ?? 'AVAILABLE',
                category: item.category?.name ?? null,
                categoryId: item.category?.id ?? null,
                imageUrl: item.logoUrl ?? item.imageUrl ?? null,
                rawData: item as object,
                syncedAt,
              },
              update: {
                name: item.name ?? 'Sem nome',
                description: item.description ?? null,
                price: item.price?.value ?? item.price?.originalValue ?? 0,
                status: item.status ?? 'AVAILABLE',
                category: item.category?.name ?? null,
                imageUrl: item.logoUrl ?? item.imageUrl ?? null,
                rawData: item as object,
                syncedAt,
              },
            });
            totalSynced++;
          }
        }

        merchantsProcessed++;
      } catch (err) {
        errors.push(`${conn.merchantId}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    const elapsed = Date.now() - startedAt;
    console.log(`[ifood-catalog-sync] ${totalSynced} itens, ${merchantsProcessed} lojas, ${elapsed}ms`);

    return NextResponse.json({
      ok: true,
      synced: totalSynced,
      merchants: merchantsProcessed,
      errors: errors.length > 0 ? errors : undefined,
      elapsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[ifood-catalog-sync] Fatal:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
