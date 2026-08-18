export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';
import {
  formatClientHeading,
  formatContactPhone,
  messageSnippet,
  pickClientContactName,
} from '@/lib/complaints/contact';

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

  const contactIds = [...new Set(run.complaints.map((c) => c.contactId))];
  const allEvidenceIds = [...new Set(run.complaints.flatMap((c) => c.evidenciaMessageIds))];

  const [evidenceMessages, inNameRows] = await Promise.all([
    allEvidenceIds.length > 0
      ? prisma.whatsAppMessage.findMany({
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
      : Promise.resolve([]),
    contactIds.length > 0
      ? prisma.whatsAppMessage.findMany({
          where: {
            userId: dbUser.id,
            contactId: { in: contactIds },
            direction: 'IN',
            timestamp: { gte: run.periodStart, lte: run.periodEnd },
            contactName: { not: null },
          },
          select: { contactId: true, contactName: true, timestamp: true },
          orderBy: { timestamp: 'asc' },
        })
      : Promise.resolve([]),
  ]);

  const evidenceById = new Map(evidenceMessages.map((m) => [m.id, m]));
  const clientNameByContact = new Map<string, string>();
  for (const row of inNameRows) {
    if (clientNameByContact.has(row.contactId)) continue;
    const name = pickClientContactName([{ direction: 'IN', contactName: row.contactName }]);
    if (name) clientNameByContact.set(row.contactId, name);
  }

  const missingNameIds = contactIds.filter((id) => !clientNameByContact.has(id));
  if (missingNameIds.length > 0) {
    const extra = await prisma.whatsAppMessage.findMany({
      where: {
        userId: dbUser.id,
        contactId: { in: missingNameIds },
        direction: 'IN',
        contactName: { not: null },
      },
      select: { contactId: true, contactName: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
    });
    for (const row of extra) {
      if (clientNameByContact.has(row.contactId)) continue;
      const name = pickClientContactName([{ direction: 'IN', contactName: row.contactName }]);
      if (name) clientNameByContact.set(row.contactId, name);
    }
  }

  const complaints = run.complaints.map((c) => {
    const contactName = clientNameByContact.get(c.contactId) ?? null;
    return {
      ...c,
      contactName,
      contactPhone: formatContactPhone(c.contactId),
      clientLabel: formatClientHeading(contactName, c.contactId),
      evidencias: c.evidenciaMessageIds
        .map((id) => evidenceById.get(id))
        .filter(Boolean)
        .map((m) => ({
          id: m!.id,
          messageType: m!.messageType,
          snippet: messageSnippet(m!.textContent, m!.messageType),
          timestamp: m!.timestamp,
        })),
    };
  });

  const confirmadasCount = complaints.filter((c) => c.confirmadoPorHumano).length;

  return NextResponse.json({
    ...run,
    complaints,
    confirmadasCount,
    hasAta: Boolean(run.ataStoragePath),
  });
}
