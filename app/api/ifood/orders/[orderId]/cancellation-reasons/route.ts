export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveOrderAction } from '@/lib/ifood-order-action';
import { getCancellationReasons } from '@/lib/ifood-api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const resolved = await resolveOrderAction(orderId);
    if (resolved.ok === false) return resolved.response;

    const { data: reasons } = await getCancellationReasons(orderId);
    return NextResponse.json({ reasons });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET orders/cancellation-reasons]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
