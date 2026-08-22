export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId } from '@/lib/reports-tenant-auth';

/**
 * GET /api/reports/complaints
 *
 * Lista ComplaintReviewRun do tenant (empresa).
 * Usado pela Central de Relatórios → aba Reclamações.
 */
export async function GET() {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const runs = await prisma.complaintReviewRun.findMany({
    where: { userId: tenantUserId },
    orderBy: { executadoEm: 'desc' },
    take: 50,
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      totalConversas: true,
      conversasProcessadas: true,
      totalReclamacoes: true,
      ataStoragePath: true,
      executadoEm: true,
      erro: true,
      complaints: {
        where: { confirmadoPorHumano: true },
        select: { id: true },
      },
    },
  });

  return NextResponse.json(
    runs.map(({ complaints, ...run }) => ({
      ...run,
      confirmadasCount: complaints.length,
    })),
  );
}
