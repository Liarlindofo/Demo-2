/**
 * Processamento em batches de um ComplaintReviewRun.
 * Cada invocação classifica no máximo BATCH_SIZE conversas e devolve o restante
 * para o próximo tick (retomável).
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { resolveStackUserIdsForTenant } from '@/lib/whatsapp-sessions';
import {
  classifyConversation,
  filterClientEvidenceIds,
  type ConversationMessage,
} from '@/lib/complaints/classify';
import {
  clusterHasContent,
  clusterIfoodMessages,
  extractIfoodGroupComplaint,
} from '@/lib/complaints/ifood-group';
import { markMessagesComplaintProcessed } from '@/lib/complaints/process-ifood-cron';
import { pickClientContactName } from '@/lib/complaints/contact';
import { buildAndSaveComparison } from '@/lib/complaints/compare';
import { monthPeriodFromDate } from '@/lib/complaints/period';

export const COMPLAINTS_BATCH_SIZE = 8;
const STALE_LOCK_MS = 4 * 60 * 1000;

export function newComplaintsJobToken(): string {
  return randomBytes(24).toString('hex');
}

export function complaintsJobBaseUrl(reqOrigin?: string): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, '');
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`;
  return (reqOrigin || 'http://localhost:3000').replace(/\/$/, '');
}

export async function enqueueComplaintsTick(params: {
  runId: string;
  jobToken: string;
  origin?: string;
}): Promise<void> {
  const url = `${complaintsJobBaseUrl(params.origin)}/api/reports/complaints/run/tick`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId: params.runId, jobToken: params.jobToken }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`tick HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
}

export async function listPeriodContacts(params: {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<{ all: string[]; withIn: string[]; outOnly: string[] }> {
  const stackIds = await resolveStackUserIdsForTenant(params.userId);
  const monitoredBots =
    stackIds.length > 0
      ? await prisma.whatsAppBot.findMany({
          where: { userId: { in: stackIds }, monitorarReclamacoes: true },
          select: { slot: true },
        })
      : [];
  const monitoredSlots = [...new Set(monitoredBots.map((b) => b.slot))];

  const hasIn = new Map<string, boolean>();
  const order: string[] = [];

  if (monitoredSlots.length > 0) {
    const rows = await prisma.whatsAppMessage.findMany({
      where: {
        userId: params.userId,
        sessionSlot: { in: monitoredSlots },
        timestamp: { gte: params.periodStart, lte: params.periodEnd },
        // 1:1: contactId só dígitos (grupos @g.us entram pelo fluxo iFood abaixo)
        NOT: { contactId: { contains: '@g.us' } },
      },
      select: { contactId: true, direction: true },
      orderBy: { timestamp: 'asc' },
    });

    for (const row of rows) {
      if (!hasIn.has(row.contactId)) {
        hasIn.set(row.contactId, false);
        order.push(row.contactId);
      }
      if (row.direction === 'IN') hasIn.set(row.contactId, true);
    }
  }

  // Grupos iFood cadastrados com mensagens no período (fonte direta do atendente)
  const ifoodGroups = await prisma.iFoodComplaintGroup.findMany({
    where: { userId: params.userId, ativo: true },
    select: { groupWhatsAppId: true, sessionSlot: true },
  });
  if (ifoodGroups.length > 0) {
    const groupIds = ifoodGroups.map((g) => g.groupWhatsAppId);
    const groupSlots = [...new Set(ifoodGroups.map((g) => g.sessionSlot))];
    const groupMsgs = await prisma.whatsAppMessage.findMany({
      where: {
        userId: params.userId,
        contactId: { in: groupIds },
        sessionSlot: { in: groupSlots },
        timestamp: { gte: params.periodStart, lte: params.periodEnd },
        direction: 'OUT',
      },
      select: { contactId: true },
      distinct: ['contactId'],
    });
    for (const row of groupMsgs) {
      if (!hasIn.has(row.contactId)) {
        hasIn.set(row.contactId, true);
        order.push(row.contactId);
      } else {
        hasIn.set(row.contactId, true);
      }
    }
  }

  const withIn = order.filter((id) => hasIn.get(id));
  const outOnly = order.filter((id) => !hasIn.get(id));
  return { all: order, withIn, outOnly };
}

async function markContactProcessed(params: {
  runId: string;
  contactId: string;
  addedComplaintCount: number;
}): Promise<void> {
  const run = await prisma.complaintReviewRun.findUnique({
    where: { id: params.runId },
    select: {
      pendingContactIds: true,
      processedContactIds: true,
      conversasProcessadas: true,
      totalReclamacoes: true,
    },
  });
  if (!run) return;
  if (run.processedContactIds.includes(params.contactId)) return;

  await prisma.complaintReviewRun.update({
    where: { id: params.runId },
    data: {
      pendingContactIds: run.pendingContactIds.filter((id) => id !== params.contactId),
      processedContactIds: run.processedContactIds.includes(params.contactId)
        ? run.processedContactIds
        : [...run.processedContactIds, params.contactId],
      conversasProcessadas: (run.conversasProcessadas ?? 0) + 1,
      totalReclamacoes: (run.totalReclamacoes ?? 0) + Math.max(0, params.addedComplaintCount),
    },
  });
}

async function classifyIfoodGroupContact(params: {
  userId: string;
  runId: string;
  contactId: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<number> {
  const group = await prisma.iFoodComplaintGroup.findFirst({
    where: {
      userId: params.userId,
      groupWhatsAppId: params.contactId,
      ativo: true,
    },
    select: {
      lojaSlug: true,
      lojaNome: true,
      sessionSlot: true,
    },
  });
  if (!group) return 0;

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      userId: params.userId,
      sessionSlot: group.sessionSlot,
      contactId: params.contactId,
      direction: 'OUT',
      timestamp: { gte: params.periodStart, lte: params.periodEnd },
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
  });

  if (messages.length === 0) return 0;

  const existingEvidence = await prisma.complaint.findMany({
    where: {
      reviewRunId: params.runId,
      userId: params.userId,
      contactId: params.contactId,
      origem: 'GRUPO_IFOOD',
    },
    select: { evidenciaMessageIds: true },
  });
  const usedIds = new Set(existingEvidence.flatMap((c) => c.evidenciaMessageIds));

  const conv: ConversationMessage[] = messages.map((m) => ({
    id: m.id,
    direction: m.direction,
    messageType: m.messageType,
    textContent: m.textContent,
    sentByAgent: m.sentByAgent,
    timestamp: m.timestamp,
  }));

  const clusters = clusterIfoodMessages(conv).filter(clusterHasContent);
  let added = 0;

  for (const cluster of clusters) {
    const clusterIds = cluster.map((m) => m.id);
    if (clusterIds.some((id) => usedIds.has(id))) {
      await markMessagesComplaintProcessed(clusterIds);
      continue;
    }

    const extracted = await extractIfoodGroupComplaint(cluster);
    if (extracted.evidenciaMessageIds.length === 0) {
      await markMessagesComplaintProcessed(clusterIds);
      continue;
    }

    await prisma.complaint.create({
      data: {
        reviewRunId: params.runId,
        userId: params.userId,
        contactId: params.contactId,
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
    for (const id of extracted.evidenciaMessageIds) usedIds.add(id);
    await markMessagesComplaintProcessed(clusterIds);
    added += 1;
  }

  return added;
}

async function classifyOneContact(params: {
  userId: string;
  runId: string;
  contactId: string;
  periodStart: Date;
  periodEnd: Date;
  palavrasChave: string[];
  monitoredSlots: number[];
}): Promise<number> {
  if (params.contactId.includes('@g.us')) {
    return classifyIfoodGroupContact(params);
  }

  const already = await prisma.complaint.findFirst({
    where: {
      reviewRunId: params.runId,
      userId: params.userId,
      contactId: params.contactId,
    },
    select: { id: true },
  });
  if (already) return 0;

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      userId: params.userId,
      sessionSlot: { in: params.monitoredSlots },
      contactId: params.contactId,
      timestamp: { gte: params.periodStart, lte: params.periodEnd },
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

  const conv: ConversationMessage[] = messages.map((m) => ({
    id: m.id,
    direction: m.direction,
    messageType: m.messageType,
    textContent: m.textContent,
    sentByAgent: m.sentByAgent,
    timestamp: m.timestamp,
  }));

  if (!conv.some((m) => m.direction === 'IN')) return 0;

  const result = await classifyConversation({
    messages: conv,
    palavrasChave: params.palavrasChave,
  });

  if (!result.eReclamacao || !result.resumo || !result.dataOcorrencia) {
    return 0;
  }

  const evidenciaMessageIds = filterClientEvidenceIds(conv, result.evidenciaMessageIds);
  if (evidenciaMessageIds.length === 0) return 0;

  const sessionSlot = messages[0]?.sessionSlot ?? params.monitoredSlots[0] ?? 1;

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
  return 1;
}

async function finishRun(runId: string, userId: string, periodStart: Date): Promise<void> {
  const counted = await prisma.complaint.count({ where: { reviewRunId: runId, userId } });
  await prisma.complaintReviewRun.update({
    where: { id: runId },
    data: {
      status: 'CONCLUIDO',
      totalReclamacoes: counted,
      batchLockAt: null,
      erro: null,
    },
  });

  await buildAndSaveComparison({
    userId,
    reviewRunId: runId,
    period: monthPeriodFromDate(periodStart),
  });
}

export async function processComplaintsBatch(runId: string): Promise<{
  done: boolean;
  skipped: boolean;
  processed: number;
  remaining: number;
  status: string;
}> {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  const locked = await prisma.complaintReviewRun.updateMany({
    where: {
      id: runId,
      status: 'PROCESSANDO',
      OR: [{ batchLockAt: null }, { batchLockAt: { lt: staleBefore } }],
    },
    data: { batchLockAt: new Date() },
  });

  if (locked.count === 0) {
    const current = await prisma.complaintReviewRun.findUnique({
      where: { id: runId },
      select: {
        status: true,
        pendingContactIds: true,
      },
    });
    return {
      done: current?.status === 'CONCLUIDO',
      skipped: true,
      processed: 0,
      remaining: current?.pendingContactIds.length ?? 0,
      status: current?.status ?? 'AUSENTE',
    };
  }

  try {
    const run = await prisma.complaintReviewRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        userId: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        pendingContactIds: true,
        processedContactIds: true,
      },
    });

    if (!run || run.status !== 'PROCESSANDO') {
      return {
        done: run?.status === 'CONCLUIDO',
        skipped: true,
        processed: 0,
        remaining: run?.pendingContactIds.length ?? 0,
        status: run?.status ?? 'AUSENTE',
      };
    }

    const pending = run.pendingContactIds.filter((id) => !run.processedContactIds.includes(id));
    if (pending.length === 0) {
      await finishRun(run.id, run.userId, run.periodStart);
      return { done: true, skipped: false, processed: 0, remaining: 0, status: 'CONCLUIDO' };
    }

    const user = await prisma.user.findUnique({
      where: { id: run.userId },
      select: { palavrasChaveReclamacao: true },
    });
    const stackIds = await resolveStackUserIdsForTenant(run.userId);
    const monitoredBots =
      stackIds.length > 0
        ? await prisma.whatsAppBot.findMany({
            where: { userId: { in: stackIds }, monitorarReclamacoes: true },
            select: { slot: true },
          })
        : [];
    const monitoredSlots = [...new Set(monitoredBots.map((b) => b.slot))];

    const batch = pending.slice(0, COMPLAINTS_BATCH_SIZE);
    let processed = 0;

    for (const contactId of batch) {
      try {
        const addedCount = await classifyOneContact({
          userId: run.userId,
          runId: run.id,
          contactId,
          periodStart: run.periodStart,
          periodEnd: run.periodEnd,
          palavrasChave: user?.palavrasChaveReclamacao ?? [],
          monitoredSlots,
        });
        await markContactProcessed({
          runId: run.id,
          contactId,
          addedComplaintCount: addedCount,
        });
        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[complaints/batch] conversa falhou, seguindo:', contactId, message);
        await markContactProcessed({
          runId: run.id,
          contactId,
          addedComplaintCount: 0,
        });
        processed += 1;
      }
    }

    const after = await prisma.complaintReviewRun.findUnique({
      where: { id: run.id },
      select: { pendingContactIds: true, status: true },
    });
    const remaining = after?.pendingContactIds.length ?? 0;

    if (remaining === 0 && after?.status === 'PROCESSANDO') {
      await finishRun(run.id, run.userId, run.periodStart);
      return { done: true, skipped: false, processed, remaining: 0, status: 'CONCLUIDO' };
    }

    await prisma.complaintReviewRun.update({
      where: { id: run.id },
      data: { batchLockAt: null },
    });

    return {
      done: false,
      skipped: false,
      processed,
      remaining,
      status: after?.status ?? 'PROCESSANDO',
    };
  } catch (err) {
    await prisma.complaintReviewRun
      .update({
        where: { id: runId },
        data: { batchLockAt: null },
      })
      .catch(() => undefined);
    throw err;
  }
}

/**
 * Retoma runs PROCESSANDO travados / com batches pendentes.
 * Sem `userId` (Vercel Cron): todos os tenants. Com `userId` (POST resume / n8n): só aquele tenant.
 */
export async function tickStaleComplaintRuns(userId?: string): Promise<{
  ticked: number;
  runIds: string[];
}> {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  const runs = await prisma.complaintReviewRun.findMany({
    where: {
      ...(userId ? { userId } : {}),
      status: 'PROCESSANDO',
      pendingContactIds: { isEmpty: false },
      OR: [{ batchLockAt: null }, { batchLockAt: { lt: staleBefore } }],
    },
    select: { id: true, jobToken: true },
    take: 5,
  });

  const runIds: string[] = [];
  for (const run of runs) {
    if (!run.jobToken) continue;
    try {
      await enqueueComplaintsTick({ runId: run.id, jobToken: run.jobToken });
      runIds.push(run.id);
    } catch (err) {
      console.error('[complaints/tick] falha ao retomar run', run.id, err);
    }
  }
  return { ticked: runIds.length, runIds };
}
