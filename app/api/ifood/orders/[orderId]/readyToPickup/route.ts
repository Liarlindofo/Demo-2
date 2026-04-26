export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readyToPickup } from '@/lib/ifood-api';
import { resolveOrderAction } from '@/lib/ifood-order-action';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const resolved = await resolveOrderAction(orderId);
    if (resolved.ok === false) return resolved.response;

    await readyToPickup(orderId);

    await db.ifoodOrder.update({
      where: { orderId },
      data: { status: 'READY_TO_PICKUP' },
    });

    return NextResponse.json({ success: true, status: 'READY_TO_PICKUP' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood readyToPickup]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
