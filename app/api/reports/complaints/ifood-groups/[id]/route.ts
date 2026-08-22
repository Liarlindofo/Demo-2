export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId } from '@/lib/reports-tenant-auth';

/**
 * DELETE /api/reports/complaints/ifood-groups/:id
 * PATCH — { ativo?: boolean, lojaNome?, lojaSlug?, sessionSlot? }
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.iFoodComplaintGroup.findFirst({
    where: { id, userId: tenantUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });

  await prisma.iFoodComplaintGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.iFoodComplaintGroup.findFirst({
    where: { id, userId: tenantUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });

  let body: {
    ativo?: boolean;
    lojaNome?: string;
    lojaSlug?: string;
    sessionSlot?: number;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  const data: {
    ativo?: boolean;
    lojaNome?: string;
    lojaSlug?: string;
    sessionSlot?: number;
  } = {};
  if (typeof body.ativo === 'boolean') data.ativo = body.ativo;
  if (typeof body.lojaNome === 'string' && body.lojaNome.trim()) {
    data.lojaNome = body.lojaNome.trim();
  }
  if (typeof body.lojaSlug === 'string' && body.lojaSlug.trim()) {
    data.lojaSlug = body.lojaSlug.trim();
  }
  if (typeof body.sessionSlot === 'number' && body.sessionSlot >= 1) {
    data.sessionSlot = Math.trunc(body.sessionSlot);
  }

  const group = await prisma.iFoodComplaintGroup.update({
    where: { id },
    data,
  });
  return NextResponse.json({ group });
}
