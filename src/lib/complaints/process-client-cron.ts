/**
 * Canal cliente (1:1): classifica conversas após janela de inatividade
 * e anexa ao ComplaintReviewRun EM_ANDAMENTO do mês.
 */

import { prisma } from '@/lib/prisma';
import { resolveStackUserIdsForTenant } from '@/lib/whatsapp-sessions';
import {
  classifyConversation,
  filterClientEvidenceIds,
  type ConversationMessage,
} from '@/lib/complaints/classify';
import { pickClientContactName } from '@/lib/complaints/contact';
import { monthPeriodFromDate, previousMonthPeriod } from '@/lib/complaints/period';
import {
  bumpRunComplaintCount,
  clientCooldownMs,
  ensureEmAndamentoRun,
  markMessagesComplaintProcessed,
} from '@/lib/complaints/continuous';

const MAX_CONTACTS_PER_TICK = 8;

/** No cron contínuo, só olha o mês atual + anterior (evita queimar histórico antigo). */
function continuousLookbackStart(): Date {
  return previousMonthPeriod().start;
}

export type ClientCronResult = {
  tenantsScanned: number;
  contactsReady: number;
  complaintsCreated: number;
  messagesMarked: number;
  skippedActive: number;
};

async function monitoredSlotsForTenant(userId: string): Promise<number[]> {
  const stackIds = await resolveStackUserIdsForTenant(userId);
  if (stackIds.length === 0) return [];
  const bots = await prisma.whatsAppBot.findMany({
    where: { userId: { in: stackIds }, monitorarReclamacoes: true },
    select: { slot: true },
  });
  return [...new Set(bots.map((b) => b.slot))];
}

async function tenantIdsWithUnprocessedClientMsgs(): Promise<string[]> {
  const rows = await prisma.whatsAppMessage.findMany({
    where: {
      complaintProcessedAt: null,
      NOT: { contactId: { contains: '@g.us' } },
    },
    select: { userId: true },
    distinct: ['userId'],
    take: 200,
  });
  return rows.map((r) => r.userId);
}

/**
 * Classifica um contato 1:1 (msgs ainda não processadas) e anexa ao run.
 */
export async function classifyCooledClientContact(params: {
  userId: string;
  runId: string;
  contactId: string;
  monitoredSlots: number[];
  palavrasChave: string[];
  includeProcessedContext?: boolean;
}): Promise<{ added: number; marked: number }> {
  const unprocessed = await prisma.whatsAppMessage.findMany({
    where: {
      userId: params.userId,
      sessionSlot: { in: params.monitoredSlots },
      contactId: params.contactId,
      complaintProcessedAt: null,
    },
    select: {
      id: true,
      direction: true,
      messageType: true,
      textContent: true,
      sentByAgent: true,
      contactName: true,
      timestamp: true,
      sessionSlot: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  if (unprocessed.length === 0) return { added: 0, marked: 0 };

  const unprocessedIds = unprocessed.map((m) => m.id);

  const already = await prisma.complaint.findFirst({
    where: {
      reviewRunId: params.runId,
      userId: params.userId,
      contactId: params.contactId,
      origem: 'CLIENTE',
    },
    select: { id: true },
  });
  if (already) {
    const marked = await markMessagesComplaintProcessed(unprocessedIds);
    return { added: 0, marked };
  }

  let messages = unprocessed;
  if (params.includeProcessedContext) {
    const firstTs = unprocessed[0]!.timestamp;
    const context = await prisma.whatsAppMessage.findMany({
      where: {
        userId: params.userId,
        sessionSlot: { in: params.monitoredSlots },
        contactId: params.contactId,
        timestamp: {
          gte: new Date(firstTs.getTime() - 24 * 60 * 60 * 1000),
          lt: firstTs,
        },
      },
      select: {
        id: true,
        direction: true,
        messageType: true,
        textContent: true,
        sentByAgent: true,
        contactName: true,
        timestamp: true,
        sessionSlot: true,
      },
      orderBy: { timestamp: 'asc' },
      take: 40,
    });
    messages = [...context, ...unprocessed];
  }

  const conv: ConversationMessage[] = messages.map((m) => ({
    id: m.id,
    direction: m.direction,
    messageType: m.messageType,
    textContent: m.textContent,
    sentByAgent: m.sentByAgent,
    timestamp: m.timestamp,
  }));

  if (!conv.some((m) => m.direction === 'IN')) {
    const marked = await markMessagesComplaintProcessed(unprocessedIds);
    return { added: 0, marked };
  }

  const result = await classifyConversation({
    messages: conv,
    palavrasChave: params.palavrasChave,
  });

  if (!result.eReclamacao || !result.resumo || !result.dataOcorrencia) {
    const marked = await markMessagesComplaintProcessed(unprocessedIds);
    return { added: 0, marked };
  }

  const evidenciaMessageIds = filterClientEvidenceIds(conv, result.evidenciaMessageIds);
  if (evidenciaMessageIds.length === 0) {
    const marked = await markMessagesComplaintProcessed(unprocessedIds);
    return { added: 0, marked };
  }

  const sessionSlot = unprocessed[0]?.sessionSlot ?? params.monitoredSlots[0] ?? 1;

  await prisma.complaint.create({
    data: {
      reviewRunId: params.runId,
      userId: params.userId,
      contactId: params.contactId,
      contactName: pickClientContactName(messages),
      resumo: result.resumo,
      dataOcorrencia: result.dataOcorrencia,
      evidenciaMessageIds,
      numeroPedido: result.numeroPedido,
      sessionSlot,
      origem: 'CLIENTE',
      lojaGrupo: null,
    },
  });

  const marked = await markMessagesComplaintProcessed(unprocessedIds);
  return { added: 1, marked };
}

/**
 * Processa conversas 1:1 cuja última mensagem passou do cooldown.
 * `cooldownMs: 0` = força (fechamento / resíduo).
 */
export async function processCooledClientConversations(opts?: {
  cooldownMs?: number;
  maxContacts?: number;
  userId?: string;
  periodStart?: Date;
  periodEnd?: Date;
}): Promise<ClientCronResult> {
  const cooldown = opts?.cooldownMs ?? clientCooldownMs();
  const maxContacts = opts?.maxContacts ?? MAX_CONTACTS_PER_TICK;
  const now = new Date();
  const cutoff = new Date(now.getTime() - cooldown);

  const result: ClientCronResult = {
    tenantsScanned: 0,
    contactsReady: 0,
    complaintsCreated: 0,
    messagesMarked: 0,
    skippedActive: 0,
  };

  const tenantIds = opts?.userId
    ? [opts.userId]
    : await tenantIdsWithUnprocessedClientMsgs();
  let budget = maxContacts;

  for (const userId of tenantIds) {
    if (budget <= 0) break;
    result.tenantsScanned += 1;

    const slots = await monitoredSlotsForTenant(userId);
    if (slots.length === 0) continue;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { palavrasChaveReclamacao: true },
    });

    const lookbackStart = opts?.periodStart ?? continuousLookbackStart();
    const lookbackEnd = opts?.periodEnd;

    const unprocessed = await prisma.whatsAppMessage.findMany({
      where: {
        userId,
        sessionSlot: { in: slots },
        complaintProcessedAt: null,
        NOT: { contactId: { contains: '@g.us' } },
        timestamp: {
          gte: lookbackStart,
          ...(lookbackEnd ? { lte: lookbackEnd } : {}),
        },
      },
      select: { contactId: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 8000,
    });

    const lastUnprocessed = new Map<string, Date>();
    for (const row of unprocessed) {
      if (!lastUnprocessed.has(row.contactId)) {
        lastUnprocessed.set(row.contactId, row.timestamp);
      }
    }

    for (const [contactId, lastUnprocTs] of lastUnprocessed) {
      if (budget <= 0) break;

      const lastMsg = await prisma.whatsAppMessage.findFirst({
        where: {
          userId,
          sessionSlot: { in: slots },
          contactId,
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });
      const lastTs = lastMsg?.timestamp ?? lastUnprocTs;

      if (lastTs > cutoff) {
        result.skippedActive += 1;
        continue;
      }

      result.contactsReady += 1;
      budget -= 1;

      const period = monthPeriodFromDate(lastTs);
      const run = await ensureEmAndamentoRun(userId, period);

      try {
        const { added, marked } = await classifyCooledClientContact({
          userId,
          runId: run.id,
          contactId,
          monitoredSlots: slots,
          palavrasChave: user?.palavrasChaveReclamacao ?? [],
          includeProcessedContext: true,
        });
        result.messagesMarked += marked;
        if (added > 0) {
          await bumpRunComplaintCount(run.id, added);
          result.complaintsCreated += added;
        } else if (marked > 0) {
          await prisma.complaintReviewRun.update({
            where: { id: run.id },
            data: { conversasProcessadas: { increment: 1 } },
          });
        }
      } catch (err) {
        console.error('[complaints/client-cron] contato falhou:', contactId, err);
      }
    }
  }

  return result;
}
