export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

interface IfoodCatalog {
  catalogId: string;
  status: string;
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
  externalCode?: string;
}

// ---------------------------------------------------------------------------
// POST /api/ifood/catalog/sync?merchantId=
// Sincroniza catálogo da API iFood para o banco local.
// Retorna { requiresHomologation: true } se a API não estiver homologada.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
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

    let token: string;
    try {
      token = await getValidIfoodToken();
    } catch {
      return NextResponse.json({ error: 'Token iFood inválido ou expirado' }, { status: 401 });
    }

    // 1. Fetch list of catalogs
    const catalogsRes = await fetch(
      `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${merchantId}/catalogs`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) },
    );

    if (catalogsRes.status === 403 || catalogsRes.status === 401) {
      return NextResponse.json({
        requiresHomologation: true,
        message:
          'A API de Catálogo do iFood requer homologação específica no iFood Developer Portal. Solicite acesso ao escopo "catalog" no portal do parceiro.',
      });
    }

    if (!catalogsRes.ok) {
      return NextResponse.json(
        { error: `Erro ao buscar catálogos: ${catalogsRes.status}` },
        { status: 502 },
      );
    }

    const catalogsData = (await catalogsRes.json()) as IfoodCatalog[] | { catalogs?: IfoodCatalog[] };
    const catalogs: IfoodCatalog[] = Array.isArray(catalogsData)
      ? catalogsData
      : (catalogsData.catalogs ?? []);

    if (catalogs.length === 0) {
      return NextResponse.json({ synced: 0, catalogs: 0, message: 'Nenhum catálogo encontrado.' });
    }

    // 2. Fetch sellable items per catalog
    let totalSynced = 0;
    const syncedAt = new Date();

    for (const catalog of catalogs) {
      const itemsRes = await fetch(
        `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${merchantId}/catalogs/${catalog.catalogId}/sellableItems`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) },
      );

      if (!itemsRes.ok) continue;

      const itemsData = (await itemsRes.json()) as
        | IfoodSellableItem[]
        | { sellableItems?: IfoodSellableItem[]; items?: IfoodSellableItem[] };

      const items: IfoodSellableItem[] = Array.isArray(itemsData)
        ? itemsData
        : (itemsData.sellableItems ?? itemsData.items ?? []);

      for (const item of items) {
        if (!item.id) continue;

        await db.ifoodCatalogItem.upsert({
          where: { itemId_merchantId: { itemId: item.id, merchantId } },
          create: {
            itemId: item.id,
            merchantId,
            userId: user.id,
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
            originalPrice: item.price?.originalValue ?? null,
            status: item.status ?? 'AVAILABLE',
            category: item.category?.name ?? null,
            categoryId: item.category?.id ?? null,
            imageUrl: item.logoUrl ?? item.imageUrl ?? null,
            rawData: item as object,
            syncedAt,
          },
        });
        totalSynced++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      catalogs: catalogs.length,
      syncedAt: syncedAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood/catalog/sync]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
