import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id, userId: rh.userId },
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
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    status?: string;
    // Campos de edição da quinzena (só permitidos se ainda sem documentos)
    periodLabel?: string;
    periodStart?: string;
    periodEnd?: string;
    deliveryCount?: number;
    amountCents?: number;
    dailyRateCents?: number;
    discountCents?: number;
    discountNotes?: string | null;
    summary?: string | null;
  };

  // Se vier campos de edição, verifica que não há documentos enviados
  const isEditing = body.periodLabel !== undefined || body.amountCents !== undefined;
  if (isEditing) {
    const period = await prisma.riderPaymentPeriod.findFirst({
      where: { id, userId: rh.userId },
      include: { documents: { select: { id: true } } },
    });
    if (!period) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (period.documents.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível editar uma quinzena com documentos enviados' },
        { status: 409 },
      );
    }
  }

  const result = await prisma.riderPaymentPeriod.updateMany({
    where: { id, userId: rh.userId },
    data: {
      ...(body.status        !== undefined && { status: body.status }),
      ...(body.periodLabel   !== undefined && { periodLabel: body.periodLabel }),
      ...(body.periodStart   !== undefined && { periodStart: new Date(body.periodStart) }),
      ...(body.periodEnd     !== undefined && { periodEnd: new Date(body.periodEnd) }),
      ...(body.deliveryCount !== undefined && { deliveryCount: body.deliveryCount }),
      ...(body.amountCents   !== undefined && { amountCents: body.amountCents }),
      ...(body.dailyRateCents !== undefined && { dailyRateCents: body.dailyRateCents }),
      ...(body.discountCents !== undefined && { discountCents: body.discountCents }),
      ...(body.discountNotes !== undefined && { discountNotes: body.discountNotes }),
      ...(body.summary       !== undefined && { summary: body.summary }),
    },
  });

  if (result.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
