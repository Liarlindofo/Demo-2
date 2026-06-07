import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getRhDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      rider: { select: { name: true, email: true, lojaId: true } },
      documents: {
        select: { id: true, documentType: true, status: true, fileName: true, storagePath: true, uploadedAt: true, reviewedAt: true },
      },
    },
  });

  if (!period) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(period);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getRhDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { status?: string };

  const result = await prisma.riderPaymentPeriod.updateMany({
    where: { id, userId: dbUser.id },
    data: { ...(body.status ? { status: body.status } : {}) },
  });

  if (result.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
