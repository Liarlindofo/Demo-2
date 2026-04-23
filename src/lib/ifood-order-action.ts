/**
 * Utilitário compartilhado para as rotas de ação de pedidos iFood.
 * Garante autenticação, lookup do usuário e ownership do pedido.
 */
import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

export async function resolveOrderAction(orderId: string): Promise<
  | { ok: true; userId: string; dbOrderId: string }
  | { ok: false; response: NextResponse }
> {
  const stackUser = await stackServerApp.getUser();
  if (!stackUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }

  const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }),
    };
  }

  const order = await db.ifoodOrder.findUnique({ where: { orderId } });
  if (!order) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 }),
    };
  }

  if (order.userId !== user.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, dbOrderId: order.id };
}
