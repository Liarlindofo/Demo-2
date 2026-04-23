import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startPreparation } from '@/lib/ifood-api';
import { resolveOrderAction } from '@/lib/ifood-order-action';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const resolved = await resolveOrderAction(orderId);
    if (!resolved.ok) return resolved.response;

    await startPreparation(orderId);

    await db.ifoodOrder.update({
      where: { orderId },
      data: { status: 'PREPARING' },
    });

    return NextResponse.json({ success: true, status: 'PREPARING' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood startPreparation]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
