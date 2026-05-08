export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { confirmOrder, startPreparation } from '@/lib/ifood-api';
import { resolveOrderAction } from '@/lib/ifood-order-action';

// ---------------------------------------------------------------------------
// POST /api/ifood/orders/:orderId/confirm
// DELIVERY: confirma + inicia preparo automaticamente → PREPARING
// TAKEOUT / outros: apenas confirma → CONFIRMED (preparo iniciado manualmente)
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const resolved = await resolveOrderAction(orderId);
    if (resolved.ok === false) return resolved.response;

    const orderRecord = await db.ifoodOrder.findUnique({
      where: { orderId },
      select: { orderType: true },
    });
    const isDelivery = orderRecord?.orderType === 'DELIVERY';

    await confirmOrder(orderId);

    if (isDelivery) {
      try {
        await startPreparation(orderId);
      } catch {
        // Se startPreparation falhar, confirmar ainda é válido
      }
      await db.ifoodOrder.update({
        where: { orderId },
        data: { status: 'PREPARING' },
      });
      return NextResponse.json({ success: true, status: 'PREPARING' });
    }

    // TAKEOUT / INDOOR / DINE_IN: aguarda ação manual de iniciar preparo
    await db.ifoodOrder.update({
      where: { orderId },
      data: { status: 'CONFIRMED' },
    });
    return NextResponse.json({ success: true, status: 'CONFIRMED' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood confirm]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
