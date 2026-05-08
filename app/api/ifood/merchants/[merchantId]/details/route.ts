export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

// ---------------------------------------------------------------------------
// GET /api/ifood/merchants/[merchantId]/details
// Retorna detalhes completos da loja via API iFood
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
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[GET merchant details] iFood error:', res.status, body);
      return NextResponse.json({ error: 'Erro ao buscar detalhes no iFood' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ merchant: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET merchant details]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
