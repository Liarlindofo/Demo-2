import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: riderId } = await params;

  const rider = await prisma.deliveryRider.findFirst({
    where: { id: riderId, userId: rh.userId },
  });
  if (!rider) return NextResponse.json({ error: 'Motoboy não encontrado' }, { status: 404 });

  const body = await req.json() as {
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    deliveryCount: number;
    amountCents: number;
    dailyRateCents?: number;
    discountCents?: number;
    discountNotes?: string;
    summary?: string;
  };

  if (!body.periodLabel || !body.periodStart || !body.periodEnd || body.amountCents == null) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  const period = await prisma.riderPaymentPeriod.create({
    data: {
      userId: rh.userId,
      riderId,
      lojaId: rider.lojaId,
      periodLabel: body.periodLabel,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      deliveryCount: body.deliveryCount ?? 0,
      amountCents: body.amountCents,
      dailyRateCents: body.dailyRateCents ?? 0,
      discountCents: body.discountCents ?? 0,
      discountNotes: body.discountNotes || null,
      summary: body.summary || null,
      createdBy: rh.userId,
    },
  });

  return NextResponse.json(period, { status: 201 });
}
