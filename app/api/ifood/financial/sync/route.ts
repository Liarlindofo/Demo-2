import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';
import { Prisma } from '@prisma/client';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// POST /api/ifood/financial/sync?merchantId=&startDate=&endDate=
// Tenta sincronizar dados da API Financeira iFood.
// Se a API não estiver disponível (permissão especial necessária), retorna aviso.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await getPrismaUser(stackUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') ?? new Date().toISOString().split('T')[0];

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId é obrigatório' }, { status: 400 });
    }

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    let token: string;
    try {
      token = await getValidIfoodToken();
    } catch {
      return NextResponse.json({
        error: 'Token iFood inválido ou expirado',
        requiresAuth: true,
      }, { status: 401 });
    }

    // Try iFood Financial Events API
    const eventsUrl = `https://merchant-api.ifood.com.br/financial/v1.0/financial-reports/merchants/${merchantId}/events?startDate=${startDate}&endDate=${endDate}&page=0&size=100`;
    const eventsRes = await fetch(eventsUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });

    if (eventsRes.status === 403 || eventsRes.status === 401) {
      return NextResponse.json({
        warning: true,
        message: 'A API Financeira do iFood requer permissões especiais não ativadas nesta conta. Os dados exibidos são calculados a partir dos pedidos registrados localmente.',
        requiresHomologation: true,
      });
    }

    if (!eventsRes.ok) {
      return NextResponse.json({
        warning: true,
        message: `API Financeira indisponível (${eventsRes.status}). Usando dados locais.`,
      });
    }

    const eventsData = (await eventsRes.json()) as {
      content?: Array<{
        eventType: string;
        amount: number;
        description: string;
        referenceDate: string;
        orderId?: string;
      }>;
    };

    const events = eventsData.content ?? [];
    let synced = 0;

    for (const event of events) {
      await db.ifoodFinancialEvent.upsert({
        where: {
          // Use a composite unique identifier — fallback to upsert by merchantId+referenceDate+amount
          id: `${merchantId}-${event.referenceDate}-${event.eventType}-${event.amount}`.replace(/[^a-zA-Z0-9-]/g, ''),
        },
        create: {
          id: `${merchantId}-${event.referenceDate}-${event.eventType}-${event.amount}`.replace(/[^a-zA-Z0-9-]/g, ''),
          merchantId,
          userId: user.id,
          eventType: event.eventType,
          amount: event.amount,
          description: event.description,
          referenceDate: new Date(event.referenceDate),
          orderId: event.orderId ?? null,
          rawData: event as unknown as Prisma.InputJsonValue,
        },
        update: {
          amount: event.amount,
          description: event.description,
        },
      });
      synced++;
    }

    // Try settlements API
    const settlementsUrl = `https://merchant-api.ifood.com.br/financial/v1.0/financial-reports/merchants/${merchantId}/settlements?startDate=${startDate}&endDate=${endDate}`;
    const settlementsRes = await fetch(settlementsUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });

    let settlementsCount = 0;
    if (settlementsRes.ok) {
      const settlementsData = (await settlementsRes.json()) as {
        settlements?: Array<{
          settlementDate: string;
          grossAmount: number;
          netAmount: number;
          commission: number;
          fees: number;
        }>;
      };
      for (const s of settlementsData.settlements ?? []) {
        const id = `${merchantId}-${s.settlementDate}`.replace(/[^a-zA-Z0-9-]/g, '');
        await db.ifoodSettlement.upsert({
          where: { id },
          create: {
            id,
            merchantId,
            userId: user.id,
            settlementDate: new Date(s.settlementDate),
            grossAmount: s.grossAmount,
            netAmount: s.netAmount,
            commission: s.commission,
            fees: s.fees,
            rawData: s as unknown as Prisma.InputJsonValue,
          },
          update: {
            grossAmount: s.grossAmount,
            netAmount: s.netAmount,
            commission: s.commission,
            fees: s.fees,
          },
        });
        settlementsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      eventsSynced: synced,
      settlementsSynced: settlementsCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood/financial/sync]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
