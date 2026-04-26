export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/dashboard/realtime?merchantId=
// Retorna pedidos das últimas 2h e status da loja para o modo tempo real.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getPrismaUser(stackUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Resolve merchant filter
    let merchantFilter: string | { in: string[] };

    if (!merchantId || merchantId === 'all') {
      const connections = await db.ifoodConnection.findMany({
        where: { userId: user.id, status: 'active' },
        select: { merchantId: true },
      });
      const ids = connections.map((c) => c.merchantId);
      if (ids.length === 0) {
        return NextResponse.json({
          recentOrders: [],
          merchantStatus: null,
          lastOrderMinutesAgo: null,
          lastOrderDescription: null,
        });
      }
      merchantFilter = { in: ids };
    } else {
      const connection = await db.ifoodConnection.findFirst({
        where: { userId: user.id, merchantId },
      });
      if (!connection) {
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
      }
      merchantFilter = merchantId;
    }

    // Recent orders (last 2h, non-test, non-cancelled)
    const recentDbOrders = await db.ifoodOrder.findMany({
      where: {
        userId: user.id,
        merchantId: merchantFilter,
        isTest: false,
        status: { not: 'CANCELLED' },
        createdAt: { gte: twoHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        orderId: true,
        displayId: true,
        customerName: true,
        totalAmount: true,
        items: true,
        createdAt: true,
        status: true,
      },
    });

    const recentOrders = recentDbOrders.map((o) => {
      const items = o.items as Array<{ name?: string; quantity?: number }>;
      return {
        orderId: o.orderId,
        displayId: o.displayId,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
        items: Array.isArray(items)
          ? items.map((i) => ({ name: i.name ?? '', quantity: i.quantity ?? 1 }))
          : [],
        createdAt: o.createdAt.toISOString(),
        status: o.status,
      };
    });

    // Last order info
    let lastOrderMinutesAgo: number | null = null;
    let lastOrderDescription: string | null = null;
    if (recentOrders.length > 0) {
      const last = recentOrders[0];
      lastOrderMinutesAgo = Math.floor(
        (Date.now() - new Date(last.createdAt).getTime()) / 60000,
      );
      const firstItem = last.items[0];
      lastOrderDescription = firstItem
        ? `${firstItem.name}${last.items.length > 1 ? ` +${last.items.length - 1}` : ''}`
        : null;
    }

    // Try to get merchant status from iFood API (best-effort for a single merchant)
    let merchantStatus: string | null = null;
    const targetMerchantId =
      typeof merchantFilter === 'string' ? merchantFilter : null;

    if (targetMerchantId) {
      try {
        const token = await getValidIfoodToken();
        const res = await fetch(
          `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${targetMerchantId}/status`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) },
        );
        if (res.ok) {
          const data = (await res.json()) as { value?: string };
          merchantStatus = data.value ?? null;
        }
      } catch {
        // Ignore — não bloquear a resposta por falha de status
      }
    }

    return NextResponse.json({
      recentOrders,
      merchantStatus,
      lastOrderMinutesAgo,
      lastOrderDescription,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/dashboard/realtime]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
