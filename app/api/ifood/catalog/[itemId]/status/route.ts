export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// PATCH /api/ifood/catalog/:itemId/status
// Body: { merchantId: string, status: 'AVAILABLE' | 'UNAVAILABLE' }
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await getPrismaUser(stackUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { itemId } = await params;
    const body = (await req.json()) as { merchantId?: string; status?: string };
    const { merchantId, status } = body;

    if (!merchantId || !status) {
      return NextResponse.json({ error: 'merchantId e status são obrigatórios' }, { status: 400 });
    }
    if (!['AVAILABLE', 'UNAVAILABLE'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido. Use AVAILABLE ou UNAVAILABLE' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.ifoodCatalogItem.findFirst({
      where: { itemId, merchantId, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    let token: string;
    try {
      token = await getValidIfoodToken();
    } catch {
      return NextResponse.json({ error: 'Token iFood inválido ou expirado' }, { status: 401 });
    }

    // Call iFood API
    const ifoodRes = await fetch(
      `https://merchant-api.ifood.com.br/catalog/v2.0/merchants/${merchantId}/sellableItems/${itemId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (ifoodRes.status === 403 || ifoodRes.status === 401) {
      return NextResponse.json(
        { error: 'Permissão negada pela API do iFood. Verifique a homologação do módulo Catalog.' },
        { status: 403 },
      );
    }

    if (!ifoodRes.ok && ifoodRes.status !== 204) {
      const errText = await ifoodRes.text().catch(() => '');
      return NextResponse.json(
        { error: `iFood API erro ${ifoodRes.status}: ${errText}` },
        { status: 502 },
      );
    }

    // Update local DB
    await db.ifoodCatalogItem.update({
      where: { itemId_merchantId: { itemId, merchantId } },
      data: { status },
    });

    // Audit log
    await db.ifoodCatalogChangeLog.create({
      data: {
        itemId,
        itemName: existing.name,
        merchantId,
        userId: user.id,
        changeType: 'STATUS',
        oldValue: existing.status,
        newValue: status,
      },
    });

    return NextResponse.json({ success: true, itemId, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[PATCH ifood/catalog/:itemId/status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
