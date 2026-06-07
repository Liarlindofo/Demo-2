import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRiderSession } from '@/lib/rider-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRiderSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id, riderId: session.riderId, userId: session.userId },
    include: {
      documents: {
        select: { id: true, documentType: true, status: true, fileName: true, uploadedAt: true },
      },
    },
  });

  if (!period) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(period);
}
