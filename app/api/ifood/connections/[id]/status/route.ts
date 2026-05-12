export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/connections/:id/status — verifica status operacional em tempo real
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getPrismaUser(stackUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const connection = await db.ifoodConnection.findUnique({ where: { id } });

    if (!connection) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    if (connection.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const token = await getValidIfoodToken();

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${connection.merchantId}/status`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      return NextResponse.json({ status: 'ERROR', connectionId: id });
    }

    type IfoodStatusItem = {
      state?: string;
      available?: boolean;
      message?: { title?: string };
    };
    const data = await res.json() as IfoodStatusItem[];

    const item = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!item) {
      return NextResponse.json({ status: 'INDISPONÍVEL', available: false, connectionId: id });
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
      connectionId: id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/connections/:id/status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
