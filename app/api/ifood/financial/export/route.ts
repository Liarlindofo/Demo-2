import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR');
}

function fmtAmount(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/financial/export?merchantId=&startDate=&endDate=&type=events|settlements
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
    const type = searchParams.get('type') ?? 'events';

    if (!merchantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'merchantId, startDate e endDate são obrigatórios' }, { status: 400 });
    }

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    let csv = '';
    let filename = '';

    if (type === 'settlements') {
      const rows = await db.ifoodSettlement.findMany({
        where: { userId: user.id, merchantId, settlementDate: { gte: start, lte: end } },
        orderBy: { settlementDate: 'desc' },
        select: { settlementDate: true, grossAmount: true, commission: true, fees: true, netAmount: true },
      });

      const header = 'Data do Repasse,Valor Bruto,Comissão iFood,Taxas,Valor Líquido\n';
      const body = rows
        .map((r) =>
          [
            fmtDate(r.settlementDate),
            fmtAmount(r.grossAmount),
            fmtAmount(r.commission),
            fmtAmount(r.fees),
            fmtAmount(r.netAmount),
          ]
            .map(escapeCSV)
            .join(','),
        )
        .join('\n');
      csv = header + body;
      filename = `repasses-ifood-${startDate}-${endDate}.csv`;
    } else {
      // Derive events from IfoodOrder (same logic as events route)
      const orders = await db.ifoodOrder.findMany({
        where: { userId: user.id, merchantId, isTest: false, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: 'desc' },
        select: { orderId: true, displayId: true, status: true, totalAmount: true, customerName: true, createdAt: true },
      });

      const header = 'Data,Tipo,Descrição,Valor (R$)\n';
      const body = orders
        .map((o) => {
          const isRefund = o.status === 'CANCELLED';
          return [
            fmtDate(o.createdAt),
            isRefund ? 'ESTORNO' : 'VENDA',
            `Pedido #${o.displayId}${o.customerName ? ` - ${o.customerName}` : ''}`,
            fmtAmount(isRefund ? -o.totalAmount : o.totalAmount),
          ]
            .map(escapeCSV)
            .join(',');
        })
        .join('\n');
      csv = header + body;
      filename = `lancamentos-ifood-${startDate}-${endDate}.csv`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/financial/export]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
