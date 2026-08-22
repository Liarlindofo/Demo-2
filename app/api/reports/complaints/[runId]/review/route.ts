export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId, getReportsTenantUserIds } from '@/lib/reports-tenant-auth';
import {
  formatClientHeading,
  formatContactPhone,
  messageSnippet,
  pickClientContactName,
} from '@/lib/complaints/contact';
import { resolveStackUserIdsForTenant } from '@/lib/whatsapp-sessions';

/**
 * GET /api/reports/complaints/:runId/review
 *
 * Detalhe do run + reclamações para revisão humana (tenant da empresa).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userIds = await getReportsTenantUserIds();
  if (!userIds) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { runId } = await params;

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId: { in: userIds } },
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
          numeroPedido: true,
          confirmadoPorHumano: true,
          sessionSlot: true,
          origem: true,
          lojaGrupo: true,
        },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  const contactIds = [...new Set(run.complaints.map((c) => c.contactId))];
  const allEvidenceIds = [...new Set(run.complaints.flatMap((c) => c.evidenciaMessageIds))];
  const slotsUsed = [...new Set(run.complaints.map((c) => c.sessionSlot).filter(Boolean))];

  const stackIds = await resolveStackUserIdsForTenant(tenantUserId);
  const [evidenceMessages, inNameRows, bots] = await Promise.all([
    allEvidenceIds.length > 0
      ? prisma.whatsAppMessage.findMany({
          where: {
            id: { in: allEvidenceIds },
            userId: { in: userIds },
          },
          select: {
            id: true,
            messageType: true,
            textContent: true,
            timestamp: true,
            direction: true,
          },
        })
      : Promise.resolve([]),
    contactIds.length > 0
      ? prisma.whatsAppMessage.findMany({
          where: {
            userId: { in: userIds },
            contactId: { in: contactIds },
            direction: 'IN',
            timestamp: { gte: run.periodStart, lte: run.periodEnd },
            contactName: { not: null },
          },
          select: { contactId: true, contactName: true, timestamp: true },
          orderBy: { timestamp: 'asc' },
        })
      : Promise.resolve([]),
    stackIds.length > 0 && slotsUsed.length > 0
      ? prisma.whatsAppBot.findMany({
          where: { userId: { in: stackIds }, slot: { in: slotsUsed } },
          select: { slot: true, label: true },
        })
      : Promise.resolve([]),
  ]);

  const sessionLabelBySlot = new Map<number, string>();
  for (const b of bots) {
    if (!sessionLabelBySlot.has(b.slot)) {
      sessionLabelBySlot.set(b.slot, b.label?.trim() || `Sessão ${b.slot}`);
    }
  }

  const evidenceById = new Map(evidenceMessages.map((m) => [m.id, m]));
  const clientNameByContact = new Map<string, string>();
  for (const row of inNameRows) {
    if (clientNameByContact.has(row.contactId)) continue;
    const name = pickClientContactName([{ direction: 'IN', contactName: row.contactName }]);
    if (name) clientNameByContact.set(row.contactId, name);
  }

  const missingNameIds = contactIds.filter(
    (id) => !clientNameByContact.has(id) && !id.includes('@g.us'),
  );
  if (missingNameIds.length > 0) {
    const extra = await prisma.whatsAppMessage.findMany({
      where: {
        userId: { in: userIds },
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
    const isIfood = c.origem === 'GRUPO_IFOOD';
    const contactName = isIfood
      ? c.lojaGrupo || c.contactName
      : clientNameByContact.get(c.contactId) ?? null;
    const clientLabel = isIfood
      ? `iFood — ${c.lojaGrupo || c.contactName || 'loja'}`
      : formatClientHeading(contactName, c.contactId);
    const sessionLabel =
      sessionLabelBySlot.get(c.sessionSlot) || `Sessão ${c.sessionSlot}`;
    const origemLabel = isIfood
      ? `iFood — ${c.lojaGrupo || 'loja'}`
      : 'Cliente';

    return {
      ...c,
      contactName,
      contactPhone: isIfood ? '' : formatContactPhone(c.contactId),
      clientLabel,
      sessionLabel,
      origemLabel,
      evidencias: c.evidenciaMessageIds
        .map((id) => evidenceById.get(id))
        .filter(Boolean)
        .map((m) => ({
          id: m!.id,
          messageType: m!.messageType,
          snippet: messageSnippet(m!.textContent, m!.messageType),
          hasMedia: m!.messageType === 'image' || m!.messageType === 'sticker',
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
