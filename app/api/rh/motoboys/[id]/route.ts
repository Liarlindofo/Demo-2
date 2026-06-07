import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getRhDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const rider = await prisma.deliveryRider.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      loja: { select: { nome: true } },
      paymentPeriods: {
        orderBy: { periodStart: 'desc' },
        include: {
          documents: {
            select: { id: true, documentType: true, status: true, fileName: true, uploadedAt: true },
          },
        },
      },
    },
  });

  if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(rider);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getRhDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    name?: string; phone?: string; lojaId?: string; status?: string;
  };

  const result = await prisma.deliveryRider.updateMany({
    where: { id, userId: dbUser.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.lojaId !== undefined ? { lojaId: body.lojaId } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  });

  if (result.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
