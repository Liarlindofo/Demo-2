export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { getCancellationReasons } from '@/lib/ifood-api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { orderId } = await params;
    const { data: reasons } = await getCancellationReasons(orderId);

    return NextResponse.json({ reasons });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET cancellation-reasons]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
