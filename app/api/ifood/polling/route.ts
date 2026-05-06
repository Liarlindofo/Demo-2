export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  pollIfoodEvents,
  acknowledgeIfoodEvents,
  getOrderDetails,
  IfoodEvent,
} from '@/lib/ifood-api';

// Mapeamento dos códigos de evento iFood para status interno
const EVENT_STATUS_MAP: Record<string, string> = {
  CANCELLED: 'CANCELLED',
  CANCELLATION_REQUESTED: 'CANCELLED',
  CONCLUDED: 'CONCLUDED',
  READY_TO_PICKUP: 'READY_TO_PICKUP',
  DISPATCHED: 'DISPATCHED',
  PREPARATION_STARTED: 'PREPARING',
  CONFIRMED: 'CONFIRMED',
};

export async function GET(req: NextRequest) {
  // Autenticação por secret de cron — sem sessão de usuário
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Buscar todos os merchants ativos
    const connections = await db.ifoodConnection.findMany({
      where: { status: 'active' },
      select: { merchantId: true, userId: true },
    });

    if (connections.length === 0) {
      return NextResponse.json({ ok: true, events: 0, message: 'Nenhum merchant ativo' });
    }

    const merchantIds = [...new Set(connections.map((c) => c.merchantId))];

    // Mapeia merchantId → userId para upsert posterior
    const merchantUserMap = new Map<string, string>(
      connections.map((c) => [c.merchantId, c.userId]),
    );

    // Polling de eventos
    const events = await pollIfoodEvents(merchantIds);
    console.log('[Polling] Eventos recebidos:', JSON.stringify(events));

    if (events.length === 0) {
      return NextResponse.json({ ok: true, events: 0 });
    }

    let processed = 0;

    for (const event of events) {
      try {
        await handleEvent(event, merchantUserMap);
        processed++;
      } catch (err) {
        // Erro em um evento não derruba o loop
        console.error(`[polling] Erro no evento ${event.id} (${event.code}):`, err);
      }
    }

    // Confirmar recebimento de TODOS os eventos (mesmo os que falharam)
    await acknowledgeIfoodEvents(
      events.map((e) => ({ id: e.id, code: e.code, fullCode: e.fullCode })),
    );

    return NextResponse.json({ ok: true, events: processed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[polling] Erro geral:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleEvent(
  event: IfoodEvent,
  merchantUserMap: Map<string, string>,
) {
  const userId = merchantUserMap.get(event.merchantId);

  if (event.code === 'PLC' || event.fullCode === 'PLACED') {
    if (!userId) {
      console.warn(`[polling] merchantId ${event.merchantId} sem userId mapeado — ignorando PLACED`);
      return;
    }

    const { data: order } = await getOrderDetails(event.orderId);

    await db.ifoodOrder.upsert({
      where: { orderId: event.orderId },
      create: {
        orderId: order.id,
        displayId: order.displayId,
        merchantId: order.merchant.id,
        userId,
        status: 'PLACED',
        orderType: order.orderType,
        orderTiming: order.orderTiming,
        customerName: order.customer?.name ?? null,
        customerPhone: order.customer?.phone?.number ?? null,
        deliveryAddress: order.delivery?.deliveryAddress ?? null,
        items: order.items,
        payments: order.payments,
        totalAmount: order.total.orderAmount,
        deliveryFee: order.total.deliveryFee ?? null,
        isTest: order.isTest,
        rawPayload: order as object,
      },
      update: {
        // Não sobrescreve status caso já exista — pedido pode ter avançado
        displayId: order.displayId,
        rawPayload: order as object,
      },
    });

    return;
  }

  // Para demais eventos, atualiza o status do pedido existente
  const newStatus = EVENT_STATUS_MAP[event.code];
  if (!newStatus) {
    // Evento desconhecido — apenas será acknowledged, sem ação
    return;
  }

  await db.ifoodOrder.updateMany({
    where: { orderId: event.orderId },
    data: { status: newStatus },
  });
}
