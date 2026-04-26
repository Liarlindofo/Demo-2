export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// POST /api/ifood/catalog/bulk-status
// Body: { merchantId: string, items: [{ id: string, status: string }] }
// Máximo de 100 itens por requisição.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await getPrismaUser(stackUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const body = (await req.json()) as {
      merchantId?: string;
      items?: Array<{ id: string; status: string }>;
    };
    const { merchantId, items } = body;

    if (!merchantId || !items?.length) {
      return NextResponse.json({ error: 'merchantId e items são obrigatórios' }, { status: 400 });
    }
    if (items.length > 100) {
      return NextResponse.json({ error: 'Máximo de 100 itens por requisição' }, { status: 400 });
    }

    // Verify ownership of all items
    const ownedItems = await db.ifoodCatalogItem.findMany({
      where: {
        userId: user.id,
        merchantId,
        itemId: { in: items.map((i) => i.id) },
      },
      select: { itemId: true, name: true, status: true },
    });

    const ownedIds = new Set(ownedItems.map((i) => i.itemId));
    const validItems = items.filter((i) => ownedIds.has(i.id));

    if (validItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum item válido encontrado' }, { status: 404 });
    }

    let token: string;
    try {
      token = await getValidIfoodToken();
    } catch {
      return NextResponse.json({ error: 'Token iFood inválido ou expirado' }, { status: 401 });
    }

    // iFood bulk status API
    const ifoodRes = await fetch(
      `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${merchantId}/sellableItems/status`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availabilities: validItems.map((i) => ({ id: i.id, status: i.status })),
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (ifoodRes.status === 403 || ifoodRes.status === 401) {
      return NextResponse.json(
        { error: 'Permissão negada. Verifique a homologação do módulo Catalog.' },
        { status: 403 },
      );
    }

    interface BulkResult {
      success: string[];
      errors: Array<{ id: string; error: string }>;
    }

    // Try to parse which items succeeded or failed
    let successIds: string[] = [];
    let errorIds: Array<{ id: string; error: string }> = [];

    if (ifoodRes.ok || ifoodRes.status === 204) {
      successIds = validItems.map((i) => i.id);
    } else {
      // Try to parse partial failure response
      try {
        const errData = (await ifoodRes.json()) as Partial<BulkResult>;
        successIds = errData.success ?? [];
        errorIds = errData.errors ?? validItems.map((i) => ({ id: i.id, error: `HTTP ${ifoodRes.status}` }));
      } catch {
        errorIds = validItems.map((i) => ({ id: i.id, error: `HTTP ${ifoodRes.status}` }));
      }
    }

    // Update DB for successful items
    if (successIds.length > 0) {
      const now = new Date();

      // Group by target status for efficient updates
      const byStatus = new Map<string, string[]>();
      for (const item of validItems) {
        if (successIds.includes(item.id)) {
          if (!byStatus.has(item.status)) byStatus.set(item.status, []);
          byStatus.get(item.status)!.push(item.id);
        }
      }

      for (const [status, ids] of byStatus) {
        await db.ifoodCatalogItem.updateMany({
          where: { merchantId, itemId: { in: ids } },
          data: { status },
        });
      }

      // Audit logs (batch)
      const logData = validItems
        .filter((i) => successIds.includes(i.id))
        .map((i) => {
          const original = ownedItems.find((o) => o.itemId === i.id);
          return {
            itemId: i.id,
            itemName: original?.name ?? i.id,
            merchantId,
            userId: user.id,
            changeType: 'STATUS',
            oldValue: original?.status ?? 'UNKNOWN',
            newValue: i.status,
            createdAt: now,
          };
        });

      if (logData.length > 0) {
        await db.ifoodCatalogChangeLog.createMany({ data: logData });
      }
    }

    return NextResponse.json({
      success: true,
      successCount: successIds.length,
      errorCount: errorIds.length,
      errors: errorIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood/catalog/bulk-status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
