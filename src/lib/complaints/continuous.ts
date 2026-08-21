/**
 * Helpers compartilhados do pipeline contínuo de reclamações
 * (iFood settle + cliente cooldown + fechamento mensal).
 */

import { prisma } from '@/lib/prisma';
import { currentMonthPeriod, type MonthPeriod } from '@/lib/complaints/period';

/** Inatividade 1:1 antes de classificar (override: COMPLAINTS_CLIENT_COOLDOWN_MS). */
export function clientCooldownMs(): number {
  const raw = process.env.COMPLAINTS_CLIENT_COOLDOWN_MS;
  if (raw && Number.isFinite(Number(raw))) return Math.max(0, Number(raw));
  return 3 * 60 * 60 * 1000; // 3h
}

/** Run aberto do período; cria EM_ANDAMENTO se não houver (nunca reusa CONCLUIDO). */
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

/**
 * Para fechamento: reusa EM_ANDAMENTO/PROCESSANDO, ou reabre o último CONCLUIDO,
 * ou cria EM_ANDAMENTO novo.
 */
export async function ensureRunForClose(
  userId: string,
  period: MonthPeriod,
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

  const concluded = await prisma.complaintReviewRun.findFirst({
    where: {
      userId,
      periodStart: period.start,
      status: 'CONCLUIDO',
    },
    orderBy: { executadoEm: 'desc' },
    select: { id: true, status: true },
  });
  if (concluded) return { id: concluded.id, status: concluded.status, created: false };

  return ensureEmAndamentoRun(userId, period);
}

export async function markMessagesComplaintProcessed(messageIds: string[]): Promise<number> {
  if (messageIds.length === 0) return 0;
  const result = await prisma.whatsAppMessage.updateMany({
    where: { id: { in: messageIds }, complaintProcessedAt: null },
    data: { complaintProcessedAt: new Date() },
  });
  return result.count;
}

export async function bumpRunComplaintCount(runId: string, added: number): Promise<void> {
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

export async function recountRunComplaints(runId: string, userId: string): Promise<number> {
  const counted = await prisma.complaint.count({ where: { reviewRunId: runId, userId } });
  await prisma.complaintReviewRun.update({
    where: { id: runId },
    data: { totalReclamacoes: counted },
  });
  return counted;
}
