export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getOrderDetails } from '@/lib/ifood-api';

// ---------------------------------------------------------------------------
// GET /api/ifood/orders/:orderId
// Retorna pedido do banco local; se não encontrado, busca na API iFood
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { orderId } = await params;

    const local = await db.ifoodOrder.findUnique({ where: { orderId } });

    if (local) {
      if (local.userId !== user.id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      return NextResponse.json({ order: local });
    }

    // Fallback: buscar na API iFood (pode não pertencer ao usuário, cuidado)
    const { data } = await getOrderDetails(orderId);
    return NextResponse.json({ order: data, source: 'ifood-api' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/orders/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
