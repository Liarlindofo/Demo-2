export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/dashboard/summary
// Query: merchantId (string | 'all'), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate e endDate são obrigatórios' },
        { status: 400 },
      );
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Resolve which merchantIds to query
    let merchantIds: string[] | null = null; // null = specific merchantId

    if (!merchantId || merchantId === 'all') {
      const connections = await db.ifoodConnection.findMany({
        where: { userId: user.id, status: 'active' },
        select: { merchantId: true },
      });
      merchantIds = connections.map((c) => c.merchantId);

      if (merchantIds.length === 0) {
        return NextResponse.json(buildEmptySummary());
      }
    } else {
      // Verify ownership
      const connection = await db.ifoodConnection.findFirst({
        where: { userId: user.id, merchantId },
      });
      if (!connection) {
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
      }
    }

    const merchantFilter =
      merchantIds !== null
        ? { in: merchantIds }
        : merchantId!;

    // Current period orders
    const allOrders = await db.ifoodOrder.findMany({
      where: {
        userId: user.id,
        merchantId: merchantFilter,
        isTest: false,
        createdAt: { gte: start, lte: end },
      },
      select: {
        status: true,
        totalAmount: true,
        customerPhone: true,
        items: true,
        createdAt: true,
      },
    });

    const nonCancelled = allOrders.filter((o) => o.status !== 'CANCELLED');
    const cancelled = allOrders.filter((o) => o.status === 'CANCELLED');

    const totalSales = nonCancelled.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = nonCancelled.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const uniqueCustomers = new Set(
      nonCancelled.map((o) => o.customerPhone).filter(Boolean),
    ).size;

    // Top items
    const itemCounts: Record<string, number> = {};
    for (const order of nonCancelled) {
      const items = order.items as Array<{ name?: string; quantity?: number }>;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.name) {
            itemCounts[item.name] = (itemCounts[item.name] ?? 0) + (item.quantity ?? 1);
          }
        }
      }
    }
    const topItems = Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Sales by hour
    const byHour: Record<number, { orders: number; revenue: number }> = {};
    for (const order of nonCancelled) {
      const h = new Date(order.createdAt).getHours();
      if (!byHour[h]) byHour[h] = { orders: 0, revenue: 0 };
      byHour[h].orders += 1;
      byHour[h].revenue += order.totalAmount;
    }
    const salesByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: byHour[hour]?.orders ?? 0,
      revenue: byHour[hour]?.revenue ?? 0,
    }));

    // Sales by day
    const byDay: Record<string, { orders: number; revenue: number }> = {};
    for (const order of nonCancelled) {
      const d = order.createdAt.toISOString().split('T')[0];
      if (!byDay[d]) byDay[d] = { orders: 0, revenue: 0 };
      byDay[d].orders += 1;
      byDay[d].revenue += order.totalAmount;
    }
    const salesByDay = Object.entries(byDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Previous period (same duration)
    const periodMs = end.getTime() - start.getTime() + 1;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - periodMs);

    const prevOrders = await db.ifoodOrder.findMany({
      where: {
        userId: user.id,
        merchantId: merchantFilter,
        isTest: false,
        status: { not: 'CANCELLED' },
        createdAt: { gte: prevStart, lte: prevEnd },
      },
      select: { totalAmount: true, customerPhone: true },
    });

    const prevTotalSales = prevOrders.reduce((s, o) => s + o.totalAmount, 0);
    const prevTotalOrders = prevOrders.length;
    const prevAverageTicket =
      prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
    const prevUniqueCustomers = new Set(
      prevOrders.map((o) => o.customerPhone).filter(Boolean),
    ).size;

    return NextResponse.json({
      totalSales,
      totalOrders,
      averageTicket,
      uniqueCustomers,
      cancelledOrders: cancelled.length,
      topItems,
      salesByHour,
      salesByDay,
      prevTotalSales,
      prevTotalOrders,
      prevAverageTicket,
      prevUniqueCustomers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/dashboard/summary]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildEmptySummary() {
  return {
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    uniqueCustomers: 0,
    cancelledOrders: 0,
    topItems: [],
    salesByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, revenue: 0 })),
    salesByDay: [],
    prevTotalSales: 0,
    prevTotalOrders: 0,
    prevAverageTicket: 0,
    prevUniqueCustomers: 0,
  };
}
