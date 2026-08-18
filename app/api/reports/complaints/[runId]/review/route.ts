export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

function evidenceSnippet(text: string | null, messageType: string): string {
  const raw = text?.trim() || '';
  if (raw.length > 0 && raw.length <= 200 && !raw.startsWith('/9j/') && !raw.startsWith('data:')) {
    return raw;
  }
  if (messageType !== 'text') return `[${messageType}]`;
  if (raw.length > 200) return `${raw.slice(0, 200)}…`;
  return raw || '[sem texto]';
}

/**
 * GET /api/reports/complaints/:runId/review
 *
 * Detalhe do run + reclamações para revisão humana (sessão logada).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const dbUser = await getSessionDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { runId } = await params;

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId: dbUser.id },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      totalConversas: true,
      totalReclamacoes: true,
      ataStoragePath: true,
      executadoEm: true,
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
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  const allEvidenceIds = [...new Set(run.complaints.flatMap((c) => c.evidenciaMessageIds))];
  const evidenceMessages =
    allEvidenceIds.length > 0
      ? await prisma.whatsAppMessage.findMany({
          where: {
            id: { in: allEvidenceIds },
            userId: dbUser.id,
            direction: 'IN',
          },
          select: {
            id: true,
            messageType: true,
            textContent: true,
            timestamp: true,
          },
        })
      : [];

  const evidenceById = new Map(evidenceMessages.map((m) => [m.id, m]));

  const complaints = run.complaints.map((c) => ({
    ...c,
    evidencias: c.evidenciaMessageIds
      .map((id) => evidenceById.get(id))
      .filter(Boolean)
      .map((m) => ({
        id: m!.id,
        messageType: m!.messageType,
        snippet: evidenceSnippet(m!.textContent, m!.messageType),
        timestamp: m!.timestamp,
      })),
  }));

  const confirmadasCount = complaints.filter((c) => c.confirmadoPorHumano).length;

  return NextResponse.json({
    ...run,
    complaints,
    confirmadasCount,
    hasAta: Boolean(run.ataStoragePath),
  });
}
