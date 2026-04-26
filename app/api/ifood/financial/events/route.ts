export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/financial/events?merchantId=&startDate=&endDate=&page=&size=&eventType=
// Deriva lançamentos de IfoodOrder (fallback local — Financial API requer permissão especial)
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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') ?? '20', 10)));
    const eventTypeFilter = searchParams.get('eventType');

    if (!merchantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'merchantId, startDate e endDate são obrigatórios' }, { status: 400 });
    }

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Check if we have synced financial events
    const syncedCount = await db.ifoodFinancialEvent.count({
      where: { userId: user.id, merchantId, referenceDate: { gte: start, lte: end } },
    });

    if (syncedCount > 0) {
      // Use synced data
      const where = {
        userId: user.id,
        merchantId,
        referenceDate: { gte: start, lte: end },
        ...(eventTypeFilter && eventTypeFilter !== 'ALL' ? { eventType: eventTypeFilter } : {}),
      };
      const [events, total] = await Promise.all([
        db.ifoodFinancialEvent.findMany({
          where,
          orderBy: { referenceDate: 'desc' },
          skip: (page - 1) * size,
          take: size,
          select: { id: true, eventType: true, amount: true, description: true, referenceDate: true, orderId: true },
        }),
        db.ifoodFinancialEvent.count({ where }),
      ]);
      return NextResponse.json({ events, total, page, totalPages: Math.ceil(total / size), dataSource: 'synced' });
    }

    // Fallback: derive events from IfoodOrder
    const orders = await db.ifoodOrder.findMany({
      where: {
        userId: user.id,
        merchantId,
        isTest: false,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true,
        displayId: true,
        status: true,
        totalAmount: true,
        customerName: true,
        createdAt: true,
      },
    });

    // Build derived events
    interface DerivedEvent {
      id: string;
      eventType: string;
      amount: number;
      description: string;
      referenceDate: Date;
      orderId: string;
    }

    const allEvents: DerivedEvent[] = orders.map((o) => ({
      id: `order-${o.orderId}`,
      eventType: o.status === 'CANCELLED' ? 'REFUND' : 'SALE',
      amount: o.status === 'CANCELLED' ? -o.totalAmount : o.totalAmount,
      description: `Pedido #${o.displayId}${o.customerName ? ` — ${o.customerName}` : ''}`,
      referenceDate: o.createdAt,
      orderId: o.orderId,
    }));

    const filtered =
      eventTypeFilter && eventTypeFilter !== 'ALL'
        ? allEvents.filter((e) => e.eventType === eventTypeFilter)
        : allEvents;

    const total = filtered.length;
    const events = filtered.slice((page - 1) * size, page * size);

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / size),
      dataSource: 'local',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/financial/events]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
