export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

// ---------------------------------------------------------------------------
// DELETE /api/ifood/merchants/[merchantId]/interruptions/[interruptionId]
// Remove uma interrupção (pausa) ativa da loja
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ merchantId: string; interruptionId: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { merchantId, interruptionId } = await params;

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 });
    }

    const token = await getValidIfoodToken();

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}/interruptions/${interruptionId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      console.error('[DELETE interruption] iFood error:', res.status, text);
      return NextResponse.json({ error: 'Erro ao remover pausa no iFood' }, { status: 502 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[DELETE interruption]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
