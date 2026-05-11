export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

// ---------------------------------------------------------------------------
// GET /api/ifood/merchants/[merchantId]/status
// Retorna status operacional em tempo real via API iFood (sem persistir no DB)
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> },
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

    const { merchantId } = await params;

    // Verifica ownership: o merchantId deve pertencer a uma conexão do usuário
    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 });
    }

    const token = await getValidIfoodToken();

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}/status`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      return NextResponse.json({ status: 'ERROR', available: false });
    }

    type IfoodStatusItem = {
      salesChannel?: string;
      operation?: string;
      state?: string;
      available?: boolean;
      message?: { title?: string; subtitle?: string };
    };
    const data = await res.json() as IfoodStatusItem[];

    const item = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!item) {
      return NextResponse.json({ status: 'INDISPONÍVEL', available: false });
    }

    const stateMap: Record<string, { status: string; available: boolean }> = {
      OK:      { status: 'ONLINE',       available: true  },
      CLOSED:  { status: 'FECHADO',      available: false },
      WARNING: { status: 'AVISO',        available: true  },
    };
    const mapped = stateMap[item.state ?? ''] ?? { status: 'INDISPONÍVEL', available: false };

    return NextResponse.json({
      status: mapped.status,
      available: mapped.available,
      message: item.message?.title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET merchant status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
