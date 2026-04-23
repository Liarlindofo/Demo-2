import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/financial/summary?merchantId=&startDate=&endDate=
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await getPrismaUser(stackUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!merchantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'merchantId, startDate e endDate são obrigatórios' }, { status: 400 });
    }

    // Verify ownership
    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const orders = await db.ifoodOrder.findMany({
      where: {
        userId: user.id,
        merchantId,
        isTest: false,
        createdAt: { gte: start, lte: end },
      },
      select: {
        status: true,
        totalAmount: true,
        payments: true,
        createdAt: true,
      },
    });

    const nonCancelled = orders.filter((o) => o.status !== 'CANCELLED');
    const cancelled = orders.filter((o) => o.status === 'CANCELLED');

    const grossRevenue = nonCancelled.reduce((s, o) => s + o.totalAmount, 0);
    const totalOrders = nonCancelled.length;
    const averageTicket = totalOrders > 0 ? grossRevenue / totalOrders : 0;
    const cancelledAmount = cancelled.reduce((s, o) => s + o.totalAmount, 0);

    // Sales by day
    const byDay: Record<string, number> = {};
    for (const o of nonCancelled) {
      const d = o.createdAt.toISOString().split('T')[0];
      byDay[d] = (byDay[d] ?? 0) + o.totalAmount;
    }
    const salesByDay = Object.entries(byDay)
      .map(([date, grossRevenue]) => ({ date, grossRevenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Payment methods aggregation
    const paymentMap: Record<string, { count: number; amount: number }> = {};
    for (const o of nonCancelled) {
      const pmts = o.payments as { methods?: Array<{ value: number; method: string; type: string }> } | null;
      const methods = pmts?.methods ?? [];
      if (methods.length === 0) {
        const key = 'UNKNOWN';
        if (!paymentMap[key]) paymentMap[key] = { count: 0, amount: 0 };
        paymentMap[key].count += 1;
        paymentMap[key].amount += o.totalAmount;
      } else {
        for (const m of methods) {
          const key = m.type === 'OFFLINE'
            ? `${m.method}_OFFLINE`
            : m.method === 'PIX'
            ? 'PIX'
            : `${m.method}_ONLINE`;
          if (!paymentMap[key]) paymentMap[key] = { count: 0, amount: 0 };
          paymentMap[key].count += 1;
          paymentMap[key].amount += m.value;
        }
      }
    }

    const topPaymentMethods = Object.entries(paymentMap)
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      grossRevenue,
      netRevenue: null,         // Requires iFood Financial API (special permissions)
      ifoodCommission: null,
      ifoodCommissionPct: null,
      serviceFee: null,
      totalOrders,
      cancelledOrders: cancelled.length,
      cancelledAmount,
      averageTicket,
      topPaymentMethods,
      salesByDay,
      dataSource: 'local' as const,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/financial/summary]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
