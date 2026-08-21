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
  IFOOD_SETTLE_MS,
} from '@/lib/complaints/ifood-group';
import { currentMonthPeriod, monthPeriodFromDate, type MonthPeriod } from '@/lib/complaints/period';

const MAX_CLUSTERS_PER_TICK = 20;

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
  settleMs = IFOOD_SETTLE_MS,
): boolean {
  const last = cluster[cluster.length - 1];
  if (!last) return false;
  return now.getTime() - last.timestamp.getTime() >= settleMs;
}

/** Run aberto do período (EM_ANDAMENTO ou PROCESSANDO); cria EM_ANDAMENTO se não houver. */
export async function ensureEmAndamentoRun(
  userId: string,
  period: MonthPeriod = currentMonthPeriod(),
): Promise<{ id: string; status: string; created: boolean }> {
  const open = await prisma.complaintReviewRun.findFirst({
    where: {
      userId,
      periodStart: period.start,
      status: { in: ['EM_ANDAMENTO', 'PROCESSANDO'] },
    },
    orderBy: { executadoEm: 'desc' },
    select: { id: true, status: true },
  });
  if (open) return { id: open.id, status: open.status, created: false };

  const late = await prisma.complaintReviewRun.findFirst({
    where: {
      userId,
      periodStart: period.start,
      status: 'CONCLUIDO',
    },
    orderBy: { executadoEm: 'desc' },
    select: { id: true, status: true },
  });
  if (late) return { id: late.id, status: late.status, created: false };

  const created = await prisma.complaintReviewRun.create({
    data: {
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      status: 'EM_ANDAMENTO',
      totalConversas: 0,
      conversasProcessadas: 0,
      totalReclamacoes: 0,
      pendingContactIds: [],
      processedContactIds: [],
    },
    select: { id: true, status: true },
  });
  return { id: created.id, status: created.status, created: true };
}

export async function markMessagesComplaintProcessed(messageIds: string[]): Promise<number> {
  if (messageIds.length === 0) return 0;
  const result = await prisma.whatsAppMessage.updateMany({
    where: { id: { in: messageIds }, complaintProcessedAt: null },
    data: { complaintProcessedAt: new Date() },
  });
  return result.count;
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

async function bumpRunComplaintCount(runId: string, added: number): Promise<void> {
  if (added <= 0) return;
  const run = await prisma.complaintReviewRun.findUnique({
    where: { id: runId },
    select: { totalReclamacoes: true },
  });
  if (!run) return;
  await prisma.complaintReviewRun.update({
    where: { id: runId },
    data: { totalReclamacoes: (run.totalReclamacoes ?? 0) + added },
  });
}

/**
 * Processa clusters iFood quietos (settle) de todos os tenants com grupos ativos.
 */
export async function processSettledIfoodClusters(): Promise<IfoodCronResult> {
  const result: IfoodCronResult = {
    groupsScanned: 0,
    clustersReady: 0,
    complaintsCreated: 0,
    messagesMarked: 0,
    skippedUnsettled: 0,
  };

  const groups = await prisma.iFoodComplaintGroup.findMany({
    where: { ativo: true },
    select: {
      userId: true,
      groupWhatsAppId: true,
      lojaNome: true,
      sessionSlot: true,
    },
  });

  const now = new Date();
  let clustersBudget = MAX_CLUSTERS_PER_TICK;

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

      if (!isClusterSettled(cluster, now)) {
        result.skippedUnsettled += 1;
        continue;
      }

      const clusterIds = cluster.map((m) => m.id);

      // Ruído sem texto/mídia: marca e segue (evita loop eterno no cron).
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
