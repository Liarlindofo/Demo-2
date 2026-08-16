export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';

/**
 * GET /api/reports/complaints/:runId
 *
 * Consulta um ComplaintReviewRun do tenant da API key, com Complaints e
 * ComplaintComparison (quando existir) — base da ata (Fase 4).
 * Auth: header x-api-key (ServiceApiKey)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const auth = await requireServiceApiKey(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { runId } = await params;

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId },
    include: {
      complaints: {
        orderBy: { dataOcorrencia: 'asc' },
        select: {
          id: true,
          contactId: true,
          contactName: true,
          resumo: true,
          dataOcorrencia: true,
          evidenciaMessageIds: true,
          confirmadoPorHumano: true,
          createdAt: true,
        },
      },
      comparison: {
        select: {
          id: true,
          previousRunId: true,
          recorrentes: true,
          novos: true,
          resolvidos: true,
          resumoTexto: true,
          createdAt: true,
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    ...run,
    hasAta: Boolean(run.ataStoragePath),
  });
}
