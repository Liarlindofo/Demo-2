export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/financial/settlements?merchantId=&startDate=&endDate=
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await getPrismaUser(stackUser.id);
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!merchantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'merchantId, startDate e endDate são obrigatórios' }, { status: 400 });
    }

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const settlements = await db.ifoodSettlement.findMany({
      where: {
        userId: user.id,
        merchantId,
        settlementDate: { gte: start, lte: end },
      },
      orderBy: { settlementDate: 'desc' },
      select: {
        id: true,
        settlementDate: true,
        grossAmount: true,
        netAmount: true,
        commission: true,
        fees: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ settlements, total: settlements.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/financial/settlements]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
