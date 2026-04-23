import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { confirmOrder, startPreparation } from '@/lib/ifood-api';
import { resolveOrderAction } from '@/lib/ifood-order-action';

// ---------------------------------------------------------------------------
// POST /api/ifood/orders/:orderId/confirm
// Confirma o pedido + inicia preparo (chamadas encadeadas para melhor UX)
// ---------------------------------------------------------------------------
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const resolved = await resolveOrderAction(orderId);
    if (resolved.ok === false) return resolved.response;

    // Chama confirm na API iFood
    await confirmOrder(orderId);

    // Encadeia startPreparation para ir direto ao preparo
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood confirm]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
