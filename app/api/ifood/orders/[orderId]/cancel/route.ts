import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestCancellation } from '@/lib/ifood-api';
import { resolveOrderAction } from '@/lib/ifood-order-action';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const resolved = await resolveOrderAction(orderId);
    if (resolved.ok === false) return resolved.response;

    const body = await req.json() as { cancellationCode?: string };
    const code = body.cancellationCode ?? '501';

    await requestCancellation(orderId, code);

    await db.ifoodOrder.update({
      where: { orderId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, status: 'CANCELLED' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood cancel]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
