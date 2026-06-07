import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRiderSession } from '@/lib/rider-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRiderSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const periods = await prisma.riderPaymentPeriod.findMany({
    where: { riderId: session.riderId, userId: session.userId },
    include: {
      documents: {
        select: { id: true, documentType: true, status: true, fileName: true, uploadedAt: true },
      },
    },
    orderBy: { periodStart: 'desc' },
  });

  return NextResponse.json(periods);
}
