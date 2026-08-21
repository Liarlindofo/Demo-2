/**
 * Cron contínuo do canal iFood (grupos): agrupa mensagens próximas, espera
 * o cluster "assentar" e anexa a reclamação ao ComplaintReviewRun EM_ANDAMENTO do mês.
 */

import { prisma } from '@/lib/prisma';
import type { ConversationMessage } from '@/lib/complaints/classify';
import {
  clusterHasContent,
  clusterIfoodMessages,
  extractIfoodGroupComplaint,
  ifoodSettleMs,
} from '@/lib/complaints/ifood-group';
import { monthPeriodFromDate, previousMonthPeriod } from '@/lib/complaints/period';
import {
  bumpRunComplaintCount,
  ensureEmAndamentoRun,
  markMessagesComplaintProcessed,
} from '@/lib/complaints/continuous';

// Re-export para callers antigos
export {
  ensureEmAndamentoRun,
  markMessagesComplaintProcessed,
  bumpRunComplaintCount,
} from '@/lib/complaints/continuous';

const MAX_CLUSTERS_PER_TICK = 20;

function continuousLookbackStart(): Date {
  return previousMonthPeriod().start;
}

export type IfoodCronResult = {
  groupsScanned: number;
  clustersReady: number;
  complaintsCreated: number;
  messagesMarked: number;
  skippedUnsettled: number;
};

function toConv(messages: {
  id: string;
  direction: string;
  messageType: string;
  textContent: string | null;
  sentByAgent: boolean;
  timestamp: Date;
}[]): ConversationMessage[] {
  return messages.map((m) => ({
    id: m.id,
    direction: m.direction,
    messageType: m.messageType,
    textContent: m.textContent,
    sentByAgent: m.sentByAgent,
    timestamp: m.timestamp,
  }));
}

export function isClusterSettled(
  cluster: ConversationMessage[],
  now = new Date(),
  settleMs?: number,
): boolean {
  const last = cluster[cluster.length - 1];
  if (!last) return false;
  const ms = settleMs ?? ifoodSettleMs();
  return now.getTime() - last.timestamp.getTime() >= ms;
}

async function clusterAlreadyInRun(params: {
  runId: string;
  userId: string;
  evidenceIds: string[];
}): Promise<boolean> {
  if (params.evidenceIds.length === 0) return false;
  const existing = await prisma.complaint.findMany({
    where: {
      reviewRunId: params.runId,
      userId: params.userId,
      origem: 'GRUPO_IFOOD',
    },
    select: { evidenciaMessageIds: true },
  });
  const evidenceSet = new Set(params.evidenceIds);
  return existing.some((c) => c.evidenciaMessageIds.some((id) => evidenceSet.has(id)));
}

/**
 * Processa clusters iFood quietos.
 * `settleMs: 0` força classificação (fechamento / resíduo).
 */
export async function processSettledIfoodClusters(opts?: {
  settleMs?: number;
  maxClusters?: number;
  userId?: string;
  periodStart?: Date;
  periodEnd?: Date;
}): Promise<IfoodCronResult> {
  const settleMs = opts?.settleMs ?? ifoodSettleMs();
  const maxClusters = opts?.maxClusters ?? MAX_CLUSTERS_PER_TICK;

  const result: IfoodCronResult = {
    groupsScanned: 0,
    clustersReady: 0,
    complaintsCreated: 0,
    messagesMarked: 0,
    skippedUnsettled: 0,
  };

  const groups = await prisma.iFoodComplaintGroup.findMany({
    where: {
      ativo: true,
      ...(opts?.userId ? { userId: opts.userId } : {}),
    },
    select: {
      userId: true,
      groupWhatsAppId: true,
      lojaNome: true,
      sessionSlot: true,
    },
  });

  const now = new Date();
  let clustersBudget = maxClusters;

  for (const group of groups) {
    if (clustersBudget <= 0) break;
    result.groupsScanned += 1;

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        userId: group.userId,
        sessionSlot: group.sessionSlot,
        contactId: group.groupWhatsAppId,
        direction: 'OUT',
        complaintProcessedAt: null,
        timestamp: {
          gte: opts?.periodStart ?? continuousLookbackStart(),
          ...(opts?.periodEnd ? { lte: opts.periodEnd } : {}),
        },
      },
      select: {
        id: true,
        direction: true,
        messageType: true,
        textContent: true,
        sentByAgent: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'asc' },
      take: 500,
    });

    if (messages.length === 0) continue;

    const conv = toConv(messages);
    const allClusters = clusterIfoodMessages(conv);

    for (const cluster of allClusters) {
      if (clustersBudget <= 0) break;

      if (!isClusterSettled(cluster, now, settleMs)) {
        result.skippedUnsettled += 1;
        continue;
      }

      const clusterIds = cluster.map((m) => m.id);

      if (!clusterHasContent(cluster)) {
        result.messagesMarked += await markMessagesComplaintProcessed(clusterIds);
        continue;
      }

      result.clustersReady += 1;
      clustersBudget -= 1;

      const period = monthPeriodFromDate(cluster[0]!.timestamp);
      const run = await ensureEmAndamentoRun(group.userId, period);

      try {
        const extracted = await extractIfoodGroupComplaint(cluster);
        if (extracted.evidenciaMessageIds.length === 0) {
          result.messagesMarked += await markMessagesComplaintProcessed(clusterIds);
          continue;
        }

        const dup = await clusterAlreadyInRun({
          runId: run.id,
          userId: group.userId,
          evidenceIds: extracted.evidenciaMessageIds,
        });
        if (dup) {
          result.messagesMarked += await markMessagesComplaintProcessed(clusterIds);
          continue;
        }

        await prisma.complaint.create({
          data: {
            reviewRunId: run.id,
            userId: group.userId,
            contactId: group.groupWhatsAppId,
            contactName: group.lojaNome,
            resumo: extracted.resumo,
            dataOcorrencia: extracted.dataOcorrencia,
            evidenciaMessageIds: extracted.evidenciaMessageIds,
            numeroPedido: extracted.numeroPedido,
            sessionSlot: group.sessionSlot,
            origem: 'GRUPO_IFOOD',
            lojaGrupo: group.lojaNome,
          },
        });
        await bumpRunComplaintCount(run.id, 1);
        result.complaintsCreated += 1;
        result.messagesMarked += await markMessagesComplaintProcessed(clusterIds);
      } catch (err) {
        console.error(
          '[complaints/ifood-cron] cluster falhou:',
          group.groupWhatsAppId,
          err,
        );
      }
    }
  }

  return result;
}
