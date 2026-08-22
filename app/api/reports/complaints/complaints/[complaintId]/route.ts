export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId } from '@/lib/reports-tenant-auth';

type PatchBody = {
  confirmadoPorHumano?: boolean;
};

/**
 * PATCH /api/reports/complaints/complaints/:complaintId
 *
 * Atualiza confirmação humana ("Incluir na ata") de uma reclamação.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ complaintId: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { complaintId } = await params;

  let body: PatchBody = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  if (typeof body.confirmadoPorHumano !== 'boolean') {
    return NextResponse.json(
      { error: 'Informe confirmadoPorHumano (boolean).' },
      { status: 400 },
    );
  }

  const existing = await prisma.complaint.findFirst({
    where: { id: complaintId, userId: tenantUserId },
    select: { id: true, reviewRunId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Reclamação não encontrada.' }, { status: 404 });
  }

  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: { confirmadoPorHumano: body.confirmadoPorHumano },
    select: {
      id: true,
      confirmadoPorHumano: true,
      reviewRunId: true,
    },
  });

  return NextResponse.json(updated);
}
