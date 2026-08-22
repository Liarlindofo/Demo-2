export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId } from '@/lib/reports-tenant-auth';
import {
  formatClientHeading,
  formatContactPhone,
  messageSnippet,
  pickClientContactName,
  speakerFromMessage,
} from '@/lib/complaints/contact';

const MAX_MESSAGES = 500;

/**
 * GET /api/reports/complaints/:runId/conversation?contactId=
 *
 * Conversa completa daquele contato no período do relatório (IN + OUT), em ordem.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { runId } = await params;
  const contactId = req.nextUrl.searchParams.get('contactId')?.trim() || '';
  if (!contactId) {
    return NextResponse.json({ error: 'Informe contactId.' }, { status: 400 });
  }

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId: tenantUserId },
    select: { id: true, periodStart: true, periodEnd: true },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  const belongs = await prisma.complaint.findFirst({
    where: { reviewRunId: runId, userId: tenantUserId, contactId },
    select: { id: true },
  });
  if (!belongs) {
    return NextResponse.json({ error: 'Contato não pertence a este relatório.' }, { status: 404 });
  }

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      userId: tenantUserId,
      contactId,
      timestamp: { gte: run.periodStart, lte: run.periodEnd },
    },
    select: {
      id: true,
      direction: true,
      sentByAgent: true,
      messageType: true,
      textContent: true,
      contactName: true,
      mediaUrl: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
    take: MAX_MESSAGES + 1,
  });

  const truncated = messages.length > MAX_MESSAGES;
  const slice = truncated ? messages.slice(0, MAX_MESSAGES) : messages;
  const contactName = pickClientContactName(slice);

  return NextResponse.json({
    contactId,
    contactPhone: formatContactPhone(contactId),
    contactName,
    clientLabel: formatClientHeading(contactName, contactId),
    periodStart: run.periodStart,
    periodEnd: run.periodEnd,
    truncated,
    messages: slice.map((m) => ({
      id: m.id,
      direction: m.direction,
      speaker: speakerFromMessage(m.direction, m.sentByAgent),
      messageType: m.messageType,
      snippet: messageSnippet(m.textContent, m.messageType),
      hasMedia: m.messageType === 'image' || m.messageType === 'sticker',
      timestamp: m.timestamp,
    })),
  });
}
