export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/merchants/status-all
// Retorna status operacional de todas as lojas iFood do usuário.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getPrismaUser(stackUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const connections = await db.ifoodConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        merchantId: true,
        merchantName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (connections.length === 0) {
      return NextResponse.json({ connections: [] });
    }

    // Fetch iFood status for all merchants in parallel (best-effort)
    let token: string | null = null;
    try {
      token = await getValidIfoodToken();
    } catch {
      // Return connections without live status if token unavailable
      return NextResponse.json({
        connections: connections.map((c) => ({ ...c, ifoodStatus: null })),
      });
    }

    const statuses = await Promise.allSettled(
      connections.map(async (conn) => {
        const res = await fetch(
          `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${conn.merchantId}/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(6000),
          },
        );
        if (!res.ok) return { id: conn.id, ifoodStatus: null as string | null };
        const data = (await res.json()) as { value?: string };
        return { id: conn.id, ifoodStatus: data.value ?? null };
      }),
    );

    const statusMap: Record<string, string | null> = {};
    for (const result of statuses) {
      if (result.status === 'fulfilled') {
        statusMap[result.value.id] = result.value.ifoodStatus;
      }
    }

    return NextResponse.json({
      connections: connections.map((c) => ({
        ...c,
        ifoodStatus: statusMap[c.id] ?? null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/merchants/status-all]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
