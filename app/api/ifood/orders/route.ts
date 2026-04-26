export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/ifood/orders?merchantId=&status=&limit=
// Lista pedidos locais filtrados por loja e/ou status
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);

    // Janela de 14 dias (limite da API iFood)
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const orders = await db.ifoodOrder.findMany({
      where: {
        userId: user.id,
        ...(merchantId ? { merchantId } : {}),
        ...(status ? { status } : {}),
        createdAt: { gte: since },
        status: status ?? { notIn: ['CONCLUDED', 'CANCELLED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderId: true,
        displayId: true,
        merchantId: true,
        status: true,
        orderType: true,
        orderTiming: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        items: true,
        payments: true,
        totalAmount: true,
        deliveryFee: true,
        isTest: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/orders]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
